import wkx from "wkx";
import { convert, type Length } from "convert";
import type { ExegesisContext, ExegesisRoute, oas3 } from "exegesis-express";
//import type { edrConfig } from '../../config/index.ts';
import { contenttypes } from "../../common/utils/contenttypes.ts";
import {
  FeaturesGeoJsonParser,
  FeaturesLinksManager,
  FeaturesRqManager,
} from "../features/features.utils.ts";
import type { EdrCollection } from "../../services/services.d.ts";
import { services } from "../../services/index.ts";
import {  TRS_Gregorian } from "../../common/utils/CrsManager.ts";
import { ValidationError } from "exegesis";
export class EdrRqManager extends FeaturesRqManager<EdrCollection> {
  /**
   * @prop wkt - original wkt string
   * @prop hasM - indicates whether temporal values are included in wkt string
   * @prop hasZ - indicates whether vertical values are included in wkt string
   * @prop tvalues - an array of date values. Only truthy for geomM wkt strings
   */
  coords: { wkt: string; hasM: boolean; hasZ: boolean } = {
    wkt: "",
    hasM: false,
    hasZ: false,
  };

  corridor: { width: number; height: number } = { width: 0, height: 0 };
  parameters: EdrCollection["parameters"] = [];
  radius: { within: number } = { within: 0 };

  instanceId?: string;
  //! Dont know if the original resolutions should be 1 or undefined
  resolutions: {
    x: number | undefined;
    y: number | undefined;
    z: number | undefined;
  } = {
    x: undefined,
    y: undefined,
    z: undefined,
  };

  queryTypeOptions: EdrCollection["data_queries"][keyof EdrCollection["data_queries"]];
  //	private corridorConfig
  constructor({
    ctx,
    collections = services.edr,
  }: //corridorConfig = { widthTargetUnit: 'meters', heightTargetUnit: 'meters' }
  {
    ctx: ExegesisContext;
    collections?: EdrCollection[];
    //		corridorConfig?: { heightTargetUnit: Length; widthTargetUnit: Length };
  }) {
    super({ ctx, collections });
  }

  coordsParser() {
    const { coords, datetime, z } = this.ctx.params.query;
    const pathList = this.ctx.route.path.split("/"),
      endpoint = pathList[pathList.length - 1];
    const allowedGeometriesOnEndpoints: {
      [key: string]: GeoJSON.GeoJsonGeometryTypes[];
    } = {
      //! The docs seem to imply that the coords can be any type for radius
      radius: ["Point", "MultiPoint"],
      position: ["Point", "MultiPoint"],
      area: ["Polygon"],
      //Strip the M values if any and force the wkt to 3D
      trajectory: ["LineString"],
      corridor: ["LineString"],
    };

    try {
      //While this would be better, potential for errors is greater is running crsParser is forgotten
      // wkx.Geometry.parse(`SRID=${this.crs.srid};${coords}`);
      const parseRes = wkx.Geometry.parse(coords.toUpperCase());

      //@ts-expect-error <because no intellisense for the parsed wkt>
      const { hasM, hasZ, points } = parseRes;

      /////@ts-expect-error <because no intellisense for the parse result>
      const type: GeoJSON.GeoJsonGeometryTypes = parseRes.toGeoJSON()["type"];
      if (["LineString", "MultiLineString"].includes(type)) {
        if (datetime && hasM)
          throw new ValidationError({
            message: `a temporal coords wkt and datetime cannot be paired in a request`,
            location: {
              name: "coords",
              in: "query",
              docPath: this.ctx.api.pathItemPtr,
            },
          });

        if (z && hasZ)
          throw new ValidationError({
            message: `a vertical coords wkt and z cannot be paired in a request`,
            location: {
              name: "coords",
              in: "query",
              docPath: this.ctx.api.pathItemPtr,
            },
          });

        if (hasM)
          this.datetime = {
            levels: points.map((p) => new Date(p.m).toISOString()),
            min: undefined,
            max: undefined,
          };
      }
      if (!allowedGeometriesOnEndpoints[endpoint].includes(type)) {
        throw new Error(
          `${type} GEOMETRY TYPE not allowed on ${endpoint} query_type`
        );
      }
      //This is invalid in POSTGRES MULTIPOINT(22.7833333 10.2833333), (29.318519 -3.324019)) but passes validation here thus use wkx's version
      this.coords = { wkt: parseRes.toWkt(), hasM, hasZ };
      return this;
    } catch (error: any) {
      console.log(error);
      throw this.ctx.makeValidationError(
        error.message || "Invalid wkt geometry",
        {
          name: "coords",
          in: "query",
          docPath: this.ctx.api.pathItemPtr,
        }
      );
    }
  }

  corridorParser(
    targetHeightUnit: Length = "metres",
    targetWidthUnit: Length = "metres"
  ) {
    const {
        "corridor-height": corridor_height,
        "corridor-width": corridor_width,
        "width-units": width_unit,
        "height-units": height_unit,
      } = this.ctx.params.query,
      docPath = this.ctx.api.pathItemPtr;

    const options = (this
      .queryTypeOptions as EdrCollection["data_queries"]["corridor"])!;

    if (!options.width_units.includes(width_unit)) {
      throw this.ctx.makeValidationError(
        "invalid width-units. Check collection metadata",
        {
          in: "query",
          name: "width-units",
          docPath,
        }
      );
    }
    if (!options.height_units.includes(height_unit)) {
      throw this.ctx.makeValidationError(
        "invalid height-units. Check collection metadata",
        {
          in: "query",
          name: "height-units",
          docPath,
        }
      );
    }

    //! REMEMBER that that there is a crs_details object that is created during config init
    this.corridor.width = convert<number, Length>(
      corridor_width,
      width_unit
    ).to(targetWidthUnit);
    //Throw error so we dont end up with NaN values
    if (Number.isNaN(this.corridor.width))
      throw this.ctx.makeValidationError("Invalid corridor-width number", {
        docPath,
        name: "corridor-width",
        in: "query",
      });
    this.corridor.height = convert<number, Length>(
      corridor_height,
      height_unit
    ).to(targetHeightUnit);
    if (Number.isNaN(this.corridor.height))
      throw this.ctx.makeValidationError("Invalid corridor-height number", {
        docPath,
        name: "corridor-height",
        in: "query",
      });
    return this;
  }

  dataQueryParser(queryType: keyof EdrCollection["data_queries"]) {
    const collection = this.collection;
    const options = collection?.data_queries[queryType];
    //const collectionBasePath=`/collections/{collectionId}`,instanceBasePath=`/collections/{collectionId}/instances/{instanceId}`;

    if (!options) {
      throw this.ctx.makeError(
        404,
        `collection does not support ${queryType}. Check collection metadata to ensure query point is available`
      );
    }
    //let loc=this.ctx.route.path.startsWith(instanceBasePath)?"instances":"collection";
    ///if(queryType!=="instances"){      if(!options.servedAt?.includes(loc)){        throw this.ctx.makeError(404,`Collection does not allow query`)      }    }
    this.queryTypeOptions = options;

    return this;
  }

  instanceParser() {
    const options = (this
      .queryTypeOptions as EdrCollection["data_queries"]["instances"])!;
    const { instanceId = options.default_instanceid } = this.ctx.params.path;

    //Transactions work better
    /*
    if (options.values && !options.values.includes(instanceId)) {
      throw this.ctx.makeError(404, `Instance does not exist`);
    }
      */
    this.instanceId = instanceId;
    return this;
  }

  override crsParser(crsList: string[] = this.collection.crs): this {
    super.crsParser(crsList);
    return this;
  }
  override bboxCrsParser(crsList: string[] = this.collection.crs): this {
    super.bboxCrsParser(crsList);
    return this;
  }
  override outputFormatParser(
    default_output_format: string = this.queryTypeOptions
      ?.default_output_format!,
    output_formats: string[] = this.queryTypeOptions?.output_formats!,
    { ...options }: { strict: boolean } = { strict: false }
  ): this {
    super.outputFormatParser(default_output_format, output_formats, {
      ...options,
    });
    return this;
  }
  resolutionParser() {
    const {
      "resolution-x": x = 1,
      "resolution-y": y = 1,
      "resolution-z": z = 1,
    } = this.ctx.params.query;
    this.resolutions = { x, y, z };
    return this;
  }

  radiusParser(targetUnit: Length = "metres") {
    const options = this
      .queryTypeOptions as EdrCollection["data_queries"]["radius"];
    const { within, "within-units": wUnits } = this.ctx.params.query;
    if (!options?.within_units.includes(wUnits)) {
      throw this.ctx.makeValidationError(
        `Invalid within-units. Valid options include: ${options?.within_units.join(
          ", \n "
        )}`,
        { in: "query", name: "within-units", docPath: this.ctx.api.pathItemPtr }
      );
    }
    this.radius = {
      within: convert<number, Length>(within, wUnits).to(targetUnit),
    };
    return this;
  }

  public get _parameters() {
    return this.collection.parameters;
  }
  parameterParser() {
    //set an empty string as default because the parameter is optional
    const { "parameter-name": PN } = this.ctx.params.query;

    const { parameters: parametersList } = this.collection;
    //Get a list of requested parameters
    const activeParameters: string[] = PN ? PN.split(",") : [];
    //Get a list of valid parameter ids from requested collection
    const declaredParameters = parametersList.map((p) => p.id);
    //Get a list of nonvalid/undeclared parameter ids from requested parameters
    const invalidParameters = activeParameters.filter(
      //@ts-expect-error <move collection[parameters] checks towards conditional checks>
      (pn) => !declaredParameters.includes(pn)
    );

    //throw 400/validation error if invalidParameters list has items
    if (invalidParameters.length > 0) {
      //      console.log(invalidParameters);
      throw this.ctx.makeValidationError(
        `invalid parameter-name items requested. Valid parameter-names may include ${parametersList
          .map(({ id }) => id)
          .join(",\n")}`,
        {
          in: "query",
          name: "parameter-name",
          docPath: this.ctx.api.pathItemPtr,
        }
      );
    }
    //Instead of filtering twice, do once
    this.parameters = parametersList.filter((pItem) =>
      activeParameters.includes(pItem.id)
    );
    return this;
  }
}

//!Fix the inclusion of query params
export function dataQueryLink(
  url: URL,
  queryType: EdrTypes.LinkObject["link"]["variables"]["query_type"] | string,
  route: ExegesisRoute,
  id: string | undefined
) {
  //Remove query parameters
  url.search = "";
  url.pathname =
    route.path === "/collections/{collectionId}/instances/{instanceId}" ||
    route.path === "/collections/{collectionId}"
      ? url.pathname + `/${queryType}`
      : url.pathname + `/${id}/${queryType}`;
  return url.toString();
}

export class EdrGeoJsonParser extends FeaturesGeoJsonParser {
  parameters: EdrCollection["parameters"];
  collectionId: string | number;
  instanceId?: string | number;
  supportsLocation?: boolean;
  server: oas3.ServerObject;
  constructor(
    args: ConstructorParameters<typeof FeaturesGeoJsonParser>[0] & {
      parameters: EdrCollection["parameters"];
      collectionId: string | number;
      instanceId?: string | number;
      supportsLocation?: boolean;
      server: oas3.ServerObject;
    }
  ) {
    super(args);
    this.server = args.server;
    this.parameters = args.parameters;
    this.collectionId = args.collectionId;
    this.instanceId = args.instanceId;
    this.supportsLocation = args.supportsLocation || false;
  }

  public edrqueryendpoint(row: { [x: string]: any }): string {
    //{server}/collections/{collectionId}/locations/{locationId} or {server}/collections/{collectionId}/instances/{instanceId}/locations/{locationId}
    const { location = "" } = row;
    if (!this.supportsLocation) return "";
    if (!row.location) return "";
    const base = `${this.server.url}/collections/${this.collectionId}`;
    return this.instanceId
      ? `${base}/instances/${this.instanceId}/locations/${location}`
      : `${base}/locations/${location}`;
  }

  getParameterValues(row: { [x: string]: any }) {
    const parametervals: { [x: string]: string | null | undefined | number } =
      this.parameters.reduce((acc, curr) => {
        acc[curr.id] = Array.isArray(row[curr.id])
          ? row[curr.id][0]
          : row[curr.id];
        return acc;
      }, {});
    return parametervals;
  }

  toEdrFeature(row: { [x: string]: any } = this.rows[0]): EdrTypes.EdrFeature {
    const feature = this.getFeature(row);
    let label = row["label"] || row["id"];

    return {
      ...feature,
      properties: {
        ...feature.properties,
        datetime: row["tmin"] & row["tmax"] ? `${row.tmin}/${row.tmax}` : "",
        "parameter-name": this.parameters.map((p) => p.id),
        //remember to replace with valid url if collection has locations
        edrqueryendpoint: this.edrqueryendpoint(row),
        label: typeof label === "object" ? label : { en: label },
        ...this.getParameterValues(row),
      },
    };
  }

  public get edrFeatureCollection(): EdrTypes.EdrFeatureCollection {
    return {
      type: "FeatureCollection",
      features: this.rows.map((r) => this.toEdrFeature(r)),
      timeStamp: new Date().toJSON(),
      numberMatched: this.rows.length,
      numberReturned: this.numberReturned,
      //Unfiltered list of all parameters
      parameters: this.parameters.map(
        ({
          id,
          unit,
          observedProperty,
          label,
          description,
          measurementType,
        }) => ({
          type: "Parameter",
          id,
          label,
          description,
          unit,
          observedProperty,
          measurementType,
        })
      ),
    };
  }
}

export function edrCollectionDocGenerator({
  metadata,
  crs,
  ctx,
  collectionId,
}: {
  ctx: ExegesisContext;
  metadata: Awaited<ReturnType<EdrCollection["extentQuery"]>>[0];
  crs: CommonTypes.CrsConfig;
  collectionId?: string | number;
}): EdrTypes.Collection {
  const {
    id,
    tmax,
    tmin,
    tvalues,
    zvalues,
    zmin,
    zmax,
    xmin,
    xmax,
    ymin,
    ymax,
  } = metadata;
  const {
    description,
    title,
    data_queries,
    crs: crsList,
    storageCRS,
    parameters,
    keywords,
    id: cId,
  } = services.edr.find((c) => c.id === collectionId || c.id === id)!;

  return {
    id,
    title,
    description,
    keywords,
    crs: crsList,
    storageCrs: storageCRS,
    extent: {
      spatial: {
        bbox: [[xmin, ymin, xmax, ymax]],
        crs: crs.crs, //crs.wkt -> Use only if custom projection
      },
      vertical: {
        interval: [
          [zmin ? zmin.toString() : null, zmax ? zmax.toString() : null],
        ],
        values: zvalues ? zvalues.map((z) => z.toString()) : undefined,
        vrs: crs.crs, //crs.wkt,->use only if custom projection
      },
      temporal: {
        interval: [[tmin, tmax]],
        trs: TRS_Gregorian,
        values: tvalues ?? undefined,
      },
    },
    output_formats: Array.from(
      new Set(
        ...Object.values(data_queries).map(
          ({ output_formats }) => output_formats
        )
      )
    ),
    parameter_names: parameters.reduce(
      (acc, { description, id, dataType, unit, observedProperty, label }) => {
        acc[id] = {
          type: "Parameter",
          id,
          description,
          label,
          unit,
          observedProperty,
          "data-type": dataType,
        };
        return acc;
      },
      {}
    ),
    data_queries: Object.entries(data_queries).reduce(
      (
        acc,
        [
          query_type,
          {
            default_output_format,
            hreflang = "en-KE",
            output_formats,
            //@ts-expect-error <type intersection error>
            height_units,
            //@ts-expect-error <type intersection error>
            width_units,
            //@ts-expect-error <type intersection error>
            within_units,
            ..._others
          },
        ]
      ) => {
        const x = new EdrLinksManager({
          ctx,
          f: default_output_format,
          output_formats,
        });
        const link =
          cId !== id
            ? x.instanceBasedQueryType(
                cId,
                id,
                query_type,
                default_output_format
              )
            : x.collectionBasedQueryType(
                cId,
                query_type,
                default_output_format
              );
        acc[query_type] = {
          link: {
            ...link,
            templated: false,
            variables: {
              title: `${query_type.toUpperCase()} queries`,
              default_output_format,
              output_formats,
              //Will be dropped in the future since query_type is declared twice
              //@ts-expect-error <string is in fact assignable to keyof data_queries>
              query_type,
              height_units,
              width_units,
              within_units,
            },
            hreflang,
          },
        } satisfies EdrTypes.DataQueries[keyof EdrTypes.DataQueries];
        return acc;
      },
      {}
    ),
  };
}

class _EdrLinksManager extends FeaturesLinksManager {
  constructor(args: ConstructorParameters<typeof FeaturesLinksManager>[0]) {
    super(args);
  }

  /**
   * Only call this when at
   * @param locationId The general location identifier associated with the point
   *
   * @returns {string}
   */
  locationLink(
    collectionId: string | number,
    instanceId: string,
    locationId: string | number
  ): string {
    const atInstance = this.ctx.route.path.startsWith(
      "/collections/{collectionId}/instances"
    );
    const collection = `/collections/${collectionId}`;
    return new URL(
      `${this.server}/${
        atInstance
          ? `${collection}/instances/${instanceId}/locations/${locationId}`
          : collection
      }`
    ).toString();
  }

  toInstances(collectionId: string | number, instanceIds: string[]) {
    const base = `/collections/${collectionId}/instances`;
    instanceIds.forEach((id) => {
      this.links.push(
        ...this.output_formats.map((of) => {
          const url = new URL(`${this.server}${base}/${id}`);
          url.searchParams.set("f", of);
          return {
            title: `Collection metadata for instance ${id}`,
            href: url.toString(),
            rel: "data",
            type: contenttypes[of],
          };
        })
      );
    });
    return this;
  }
}

//Two scenarios
//We are at /collections and we want to links to /collections/:collectionId/:queryType
//We are at /collections/:collectionId/instances and we want links to /collections/:collectionId/instances/:instanceId/:queryType
export class EdrLinksManager extends FeaturesLinksManager {
  constructor(args: ConstructorParameters<typeof FeaturesLinksManager>[0]) {
    super(args);
  }

  toInstance(collectionId: string, id: string | number) {
    const base = `/collections/${collectionId}/instances`;

    this.links.push(
      ...this.output_formats.map((of) => {
        const url = new URL(`${this.server}${base}/${id}`);
        url.searchParams.set("f", of);
        return {
          href: url.toString(),
          rel: "collection",
          type: contenttypes[of],
          title: `View instance ${id} as ${of}`,
        };
      })
    );

    return this;
  }

  collectionBasedQueryType(
    collectionId: string | number,
    query_type: string,
    default_output_format: string
  ): CommonTypes.Link {
    const base = new URL(
      `${this.server}/collections/${collectionId}/${query_type}`
    );
    return {
      title: `Query collection using ${query_type}`,
      href: base.toString(),
      rel: ["items"].includes(query_type) ? "items" : "data",
      type: contenttypes[default_output_format.toLowerCase()],
    };
  }

  instanceBasedQueryType(
    collectionId: string | number,
    instanceId: string | number,
    query_type: string,
    default_output_format: string
  ): CommonTypes.Link {
    const base = new URL(
      `${this.server}/collections/${collectionId}/instances/${instanceId}/${query_type}`
    );
    return {
      title: `Query collection using ${query_type}`,
      href: base.toString(),
      rel: ["items"].includes(query_type) ? "items" : "data",
      type: contenttypes[default_output_format.toLowerCase()],
    };
  }
}


