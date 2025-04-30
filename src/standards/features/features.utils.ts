import type {
  EdrCollection,
  FeaturesCollection,
} from "../../services/services.d.js";
import type { ExegesisContext } from "exegesis-express";
import type { CrsConfig } from "../../types/commontypes.d.js";
import { CRS84Attr, CrsManager, CRS84 } from "../../common/utils/CrsManager.js";
import { contenttypes } from "../../common/utils/contenttypes.js";
import { services } from "../../services/index.js";

/**
 *@description Takes spatial extents and returns a collection metadata document
 */

export function featuresCollectionDocGenerator({
  metadata,
  crs,
}: {
  metadata: Awaited<ReturnType<FeaturesCollection["extentQuery"]>>[0];
  //collections: FeaturesCollection[];
  crs: CommonTypes.CrsConfig;
}): CommonTypes.Collection {
  const { id, tmin, tmax, xmin, ymin, xmax, ymax, zmin, zmax } = metadata;
  const collection = services.features.find((c) => c.id === id)!;
  return {
    id,
    extent: {
      spatial: {
        bbox: !crs.hasZ
          ? [[xmin, ymin, xmax, ymax]]
          : [[xmin, ymin, zmin || 0, xmax, ymax, zmax || 0]],
        crs: crs.crs,
      },
      temporal: {
        interval: [[tmin, tmax]],
        trs: "http://www.opengis.net/def/uom/ISO-8601/0/Gregorian",
      },
    },
    crs: Array.from(new Set([CRS84, ...collection.crs])),
    storageCrs: collection.storageCRS,
    itemType: "feature",
    //links:
  };
}

export class FeaturesRqManager<
  T extends FeaturesCollection | EdrCollection = FeaturesCollection
> {
  collections: T[];
  ctx: ExegesisContext;
  //@ts-expect-error <maybe move this to a getter instead>
  collection: T;
  crs: CrsConfig = CRS84Attr;
  bboxCrs: CrsConfig = CRS84Attr;
  bbox: CommonTypes.Bbox | undefined;
  output_formats: string[] = [];
  z: {
    levels: number[] | undefined;
    min: number | undefined;
    max: number | undefined;
  } = { min: undefined, max: undefined, levels: undefined };
  datetime: {
    levels: string[] | undefined;
    min: string | undefined;
    max: string | undefined;
  } = { levels: undefined, max: undefined, min: undefined };
  offset: number = 0;
  limit: number = 20;
  contentCrsHeader: [string, string] = ["content-crs", `<${CRS84}>`];
  contentTypeHeader: [string, string] = ["content-type", contenttypes.json];
  f: keyof typeof contenttypes = "json";
  constructor({
    ctx,
    //@ts-expect-error <read up more>
    collections = services.features,
  }: {
    ctx: ExegesisContext;
    collections?: T[];
  }) {
    this.collections = collections;
    this.ctx = ctx;
  }

  crsManager = new CrsManager();
  public get url() {
    return new URL(this.ctx.req.url!, this.ctx.api.serverObject?.url);
  }
  collectionParser() {
    const collection = this.collections.find(
      (collection) => collection.id === this.ctx.params.path.collectionId
    );
    //console.log(collection)
    if (!collection) {
      throw this.ctx.makeError(404, "specified collection not found");
    }
    this.collection = collection;
    return this;
  }

  /**
   *
   * @param crsList a list of allowed crs uris
   * Also sets the value of the content-crs header
   */
  crsParser(crsList: string[] = this.collection.crs || []) {
    const param = this.ctx.params.query.crs || CRS84;
    crsList = Array.from(new Set([...(crsList || []), CRS84]));
    if (!crsList.includes(param))
      throw this.ctx.makeValidationError(
        "invalid crs. Check that the requested crs exists in collection metadata",
        { in: "query", name: "crs", docPath: this.ctx.api.pathItemPtr }
      );
    this.crs = this.crsManager.getCrsByUri(param) || CRS84Attr;
    this.contentCrsHeader = ["content-crs", `<${this.crs.crs}>`];
    return this;
  }

  bboxCrsParser(crsList: string[] = this.collection.crs || []) {
    const param = this.ctx.params.query["bbox-crs"] || CRS84;
    crsList = Array.from(new Set([...crsList, CRS84]));

    if (!crsList.includes(param))
      throw this.ctx.makeValidationError(
        "invalid crs. Check that the requested crs exists in collection metadata",
        { in: "query", name: "bbox-crs", docPath: this.ctx.api.pathItemPtr }
      );
    this.bboxCrs = this.crsManager.getCrsByUri(param) || CRS84Attr;
    return this;
  }

  bboxParser() {
    //Some endpoints such as /collections dont have a bbox-crs parameter thus rely on crs
    const { flipCoords } = this.bboxCrs || this.crs;
    const param = this.ctx.params.query.bbox;
    let xy: CommonTypes.Bbox | undefined = undefined;
    //let z: [number, number] | undefined = undefined;
    if (param) {
      if (param.length === 4) {
        xy = flipCoords
          ? //Since we can use ST_3dExtent, we can reduce code complexity and use the bbox as intended
            [param[1], param[0], param[3], param[2]]
          : [param[0], param[1], param[2], param[3]];
      } else {
        xy = flipCoords
          ? [param[1], param[0], param[4], param[3]]
          : [param[0], param[1], param[3], param[4]];
        this.z = {
          levels: undefined,
          min: param[2],
          max: param[5],
        };
      }
    }
    this.bbox = xy;
    return this;
  }

  zParser() {
    const param = this.ctx.params.query.z;
    let max: number | undefined = undefined;
    let min: number | undefined = undefined;
    let levels: number[] | undefined = undefined;
    if (param) {
      if (param.startsWith("R")) {
        //
        const cfg = param.substring(1).split("/");
        levels = [];
        //const {a}=cfg;

        const intervals = parseFloat(cfg[0]),
          start = parseFloat(cfg[1]),
          delta = parseFloat(cfg[2]);
        for (let i = start; i <= start + intervals * delta; i += delta) {
          levels.push(i);
        }
      } else {
        if (!param.includes(",") && !param.includes("/")) {
          levels = [parseFloat(param)];
        }
        if (param.includes(",")) {
          levels = param.split(",").map((l) => parseFloat(l));
        }
        if (param.includes("/")) {
          [min, max] = param.split("/").map((l) => parseFloat(l));
        }
      }
    }
    this.z = { levels, min, max };
    return this;
  }

  datetimeParser() {
    //@ts-expect-error
    const { datetime: param }: { datetime: string } = this.ctx.params.query;
    let max: string | undefined = undefined,
      min: string | undefined = undefined,
      levels: string[] | undefined = undefined;
    if (param) {
      if (param.includes("/")) {
        if (param.startsWith("../"))
          max = new Date(param.split("../")[0]).toISOString();
        else if (param.endsWith("/.."))
          min = new Date(param.split("/..")[0]).toISOString();
        else
          [min, max] = param.split("/").map((d) => new Date(d).toISOString());
      } else {
        if (param.includes(","))
          levels = param.split(",").map((d) => new Date(d).toISOString());
        else levels = [new Date(param).toISOString()];
      }
    }
    this.datetime = { levels, max, min };
    return this;
  }

  offsetParser() {
    const param = this.ctx.params.query.offset;
    this.offset = isNaN(+param) ? 0 : param;
    return this;
  }

  limitParser(defaultLimit = 20, maxLimit = 100) {
    //    const param = this.ctx.params.query.limit;
    let { limit = defaultLimit } = this.ctx.params.query;

    //this.limit = limit > maxLimit ? maxLimit : limit < 0 ? defaultLimit : limit;
    this.limit = limit < 0 ? defaultLimit : limit;
    return this;
  }

  /**
   * @deprecated
   */
  contentCrsHeaderParser() {
    const crs = this.crs.crs;
    this.contentCrsHeader = ["content-crs", `<${crs}>`];
    return this;
  }

  outputFormatParser(
    default_output_format: string = "json",
    output_formats: string[] = [default_output_format],
    { strict }: { strict: boolean } = { strict: false }
  ) {
    const { f = default_output_format }: { f?: string } = this.ctx.params.query;
    if (
      !output_formats
        .map((of) => (strict ? of : of.toLowerCase()))
        .includes(strict ? f : f.toLowerCase())
    ) {
      throw this.ctx.makeValidationError(
        `invalid output format. Valid options include ${output_formats.join(
          ","
        )}`,
        {
          in: "query",
          name: "f",
          docPath: this.ctx.api.pathItemPtr,
        }
      );
    }
    this.f = f.toLowerCase() as keyof typeof contenttypes;
    this.contentTypeHeader = [
      "content-type",
      contenttypes[this.f] ?? contenttypes.json,
    ];
    this.output_formats = output_formats;
    return this;
  }
}

export class FeaturesGeoJsonParser {
  rows: { [x: string]: any }[];
  numberMatched: number;
  offset: number;
  limit: number;

  /**
   *
   * @param datetime the key of datetime
   * @param geometry the key of the geometry. Defaults to geom
   * @param rows list of records to be parsed
   * @param limit length of records(features) that client requested //TODO records.length vs limit
   * @param offset number of records to skip(skipped)
   * @param count number of records that matched conditions
   */
  constructor({
    rows = [],
    offset,
    numberMatched,
    limit,
  }: {
    rows: { [x: string]: any }[] | null;
    numberMatched: number;
    offset: number;
    limit: number;
  }) {
    this.rows = rows === null ? [] : rows;
    this.offset = offset;
    this.numberMatched = numberMatched;
    this.limit = limit;
  }

  get numberReturned() {
    //Use PYGEO's implementation
    let numberReturned =
      this.limit < this.numberMatched ? this.limit : this.numberMatched;
    return this.rows.length; //Math.min(this.rows.length,this.limit);
    /*
    let numberReturned = 0;
    const startIndex = Math.min(this.offset, this.count);
    const endIndex = Math.min(startIndex + this.limit, this.count);
    numberReturned += endIndex - startIndex;
    return numberReturned;
    */
  }

  public get featureCollection(): CommonTypes.FeatureCollection {
    return {
      type: "FeatureCollection",
      timeStamp: new Date().toJSON(),
      //Is supposed to be length of the array
      numberReturned: this.numberReturned,
      //Is supposed to be total items matching filters. Tests fail despite numberMatched and numberReturned being correct
      numberMatched: this.rows.length,
      features: this.rows.map((r) => this.getFeature(r)),
    };
  }

  //Make this generic
  getFeature(row: { [x: string]: any } = this.rows[0]): CommonTypes.Feature {
    const { geom: geometry, id, ...others } = row;
    delete geometry.crs;
    return {
      type: "Feature",
      geometry,
      id,
      properties: {
        ...others,
        id,
      },
    };
  }
}

export class FeaturesLinksManager {
  ctx: ExegesisContext;
  links: CommonTypes.Link[];
  f: keyof typeof contenttypes;
  output_formats: string[];
  constructor({
    ctx,
    f,
    output_formats,
  }: {
    ctx: ExegesisContext;
    f: keyof typeof contenttypes;
    output_formats: string[];
  }) {
    this.ctx = ctx;
    this.links = [];
    this.f = f;
    this.output_formats = output_formats.map((of) => of.toLowerCase());
  }
  get url() {
    return new URL(this.ctx.req?.url!, this.ctx.api.serverObject?.url!);
  }

  get server() {
    return this.ctx.api.serverObject?.url!;
  }
  //Replace the original output_formats. Useful for links to /items which may use geojson as f while /collections uses json
  override_output_formats(output_formats: string[]): this {
    this.output_formats = output_formats.map((of) => of.toLowerCase());
    return this;
  }
  self(): this {
    this.links.push({
      href: this.url.toString(),
      type: contenttypes[this.f],
      rel: "self",
      title: `This document as ${this.f.toUpperCase()}`,
    });
    return this;
  }

  alternates(): this {
    this.links.push(
      ...this.output_formats
        .filter((of) => of !== this.f)
        .map((of) => {
          const url = new URL(this.url);
          //Replace the f parameter
          url.searchParams.set("f", of);
          return {
            href: url.toString(),
            type: contenttypes[of],
            title: `View this document as ${of.toUpperCase()}`,
            rel: "alternate",
          };
        })
    );
    return this;
  }

  /**
   * @deprecated
   * Not needed because there is no need to link landing page from other routes
   *
   */
  public get root() {
    return `${this.server}/`;
  }

  conformance(): this {
    const url = new URL(`${this.server}/conformance`);

    this.links.push(
      /*
      ...this.output_formats.map((of) => {
        url.searchParams.set("f", of);

        return {
          title: `View conformance classes document as ${of.toUpperCase()}`,
          href: url.toString(),
          rel: "conformance",
          type: contenttypes[of],
        };
      })
        */
      {
        href: url.toString(),
        type: contenttypes.json,
        title: `conformance`,
        rel: "conformance",
      }
    );
    return this;
  }

  serviceDoc(): this {
    this.links.push({
      href: `${this.server}/api.html`,
      type: "text/html",
      title: `View the OpenAPI document inside an interactive console`,
      rel: "service-doc",
    });
    return this;
  }

  serviceDesc(): this {
    const url = new URL(`${this.server}/api`);
    const x = {
      href: url.toString(),
      title: `View the document powering this server`,
      rel: "service-desc",
      type:
        //of === "json"?
        "application/vnd.oai.openapi+json;version=3.0",
      //  : of === "yaml"
      //? "application/vnd.oai.openapi;version=3.0"
      //: contenttypes[of],
    };
    this.links.push(
      x
      /*

      ...this.output_formats.map((of) => {
        url.searchParams.set("f", of);
        return {
          href: url.toString(),
          title: `View the document powering this server`,
          rel: "service-desc",
          type:
            of === "json"
              ? "application/vnd.oai.openapi+json;version=3.0"
              : of === "yaml"
              ? "application/vnd.oai.openapi;version=3.0"
              : contenttypes[of],
        };
      })
        */
    );
    return this;
  }

  collections(): this {
    const href = new URL(`${this.server}/collections`).toString();

    this.links.push(
      /*
      ...this.output_formats.map((of) => {
        url.searchParams.set("f", of);
        return {
          title: "View available datas.js",
          href: url.toString(),
          type: contenttypes[of],
          rel: "data",
        };
      })
        */
      { href, title: `Collections`, rel: "data", type: contenttypes.json }
    );
    return this;
  }

  collection(id: string | number): this {
    const url = new URL(`${this.server}/collections/${id}`);
    this.links.push(
      ...this.output_formats.map((of) => {
        url.searchParams.set("f", of);
        return {
          title: `View specific collection metadata page`,
          href: url.toString(),
          rel: "collection",
          type: contenttypes[of],
        };
      })
    );
    return this;
  }

  items(collectionId: string | number): this {
    const url = new URL(`${this.server}/collections/${collectionId}/items`);
    this.links.push(
      /*
      ...this.output_formats.map((of) => {
        //let isDefault = ["json", "geojson"].includes(of);
        //url.searchParams.set("f", of);
        return {
          title: `View items available in this collection`,
          href: url.toString(),
          rel: "items",
          type: isDefault ? contenttypes.geojson : contenttypes[of],
        };
      })
        */ {
        href: url.toString(),
        type: contenttypes.geojson,
        title: `Items`,
        rel: "items",
      }
    );
    return this;
  }
  itemId(collectionId: string | number, itemId: string | number): this {
    const url = new URL(
      `${this.server}/collections/${collectionId}/items/${itemId}`
    );
    this.links.push(
      ...this.output_formats.map((of): CommonTypes.Link => {
        url.searchParams.set("f", of);
        return {
          title: `View items available in this collection`,
          href: url.toString(),
          rel: "items",
          type: contenttypes[of],
        };
      })
    );
    return this;
  }

  paginationLinks(numberMatched: number, limit: number, offset: number): this {
    //Use Pygeo's implementation
    const hasPrevPage = offset > 0;
    const hasNextPage = numberMatched > limit + offset; // <= 1; //currentPage < pages;

    const url = new URL(this.url);
    if (hasNextPage) {
      //@ts-expect-error <parseInt expects args[0] as string>
      url.searchParams.set("offset", parseInt(limit + offset).toString());
      url.searchParams.set("limit", limit.toString());

      this.links.push({
        title: `View next page of results`,
        href: url.toString(),
        rel: "next",
        type: contenttypes[this.f],
      });
    }

    //! Not appearing in
    if (hasPrevPage) {
      //@ts-expect-error <parseInt expects args[0] as string> !!Need fixing. Incorrect values
      url.searchParams.set("offset", parseInt(limit - offset).toString());
      url.searchParams.set("limit", limit.toString());

      this.links.push({
        title: `View previous page of results`,
        href: url.toString(),
        rel: "prev",
        type: contenttypes[this.f],
      });
    }
    //next

    return this;
  }
  //From / to /collections

  //from / to /api.html

  //from / to /api

  //from / to /conformance

  //from /collections to /collections/:collectionId

  //from /collections/:collectionid to /collections/:collectionid/items

  //from /collections/:collectionid/items to /collections/:collectionId/items/:itemId & to /collections/:collectionId

  //from /collections/:collectionId/items/:itemId to /collections/:collectionId/items
  //Also need paginated links for featurecollections

  //We also need to persist the urlsearchparams for the self and alt links

  //  public
}
