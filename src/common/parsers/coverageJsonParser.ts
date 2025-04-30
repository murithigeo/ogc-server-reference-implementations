import type { EdrCollection } from "../../services/services.d.js";
import { HttpError } from "exegesis";
type Row = {
  [x: string]: any;
};
export class CoverageJsonParser {
  crs: CommonTypes.CrsConfig;
  covjsonDoc: CoverageJSON.CoverageJSON = {};
  parameters: EdrCollection["parameters"];
  rows: Row[];
  constructor({
    crs,
    parameters,
    rows,
  }: {
    rows: Row[];
    parameters: CoverageJsonParser["parameters"];
    crs: CoverageJsonParser["crs"];
  }) {
    this.crs = crs;
    this.parameters = parameters;
    this.rows = rows;
  }

  _prepareDatetime(row: Row) {
    let datetime = row["datetime"];
    datetime = datetime
      ? Array.isArray(datetime)
        ? datetime
        : [datetime]
      : datetime;
    row.datetime = datetime;
    return row;
  }
  coverageParse(
    row: Row = this.rows[0],
    includeReferencing: boolean = false
  ): CoverageJSON.Coverage {
    row = this._prepareDatetime(row);
    const domain = this.domainParse(row, includeReferencing);
    return {
      type: "Coverage",
      domain,
      ranges: this.rangeParse(row, domain.domainType),
    };
  }
  /**
   *
   * @param row
   * @param {boolean} referencing Add referencing metadata to the Domain.
   * @returns
   */
  domainParse(row: Row, referencing: boolean): CoverageJSON.Domain {
    const geom: GeoJSON.Geometry = row.geom;
    const datetime = row.datetime;
    //@ts-expect-error
    let domain: CoverageJSON.Domain = undefined;
    switch (geom.type) {
      case "Point":
        domain = this.pointGeoJSONParser(geom, datetime);
        break;
      case "MultiPoint":
        domain = this.multipointGeoJSONParser(geom, datetime);
        break;
      case "LineString":
        domain = this.lineStringGeoJSONParser(geom, datetime);
        break;
      case "Polygon":
        domain = this.polygonGeoJSONParser(geom, datetime);
        break;
      case "MultiPolygon":
        domain = this.multiPolygonGeoJSONParser(geom, datetime);
        break;
      default:
        console.log(__filename);
        throw new HttpError(
          500,
          `Unable to parse ${geom.type} to relevant Domain`
        );
    }
    return {
      ...domain,
      referencing: referencing ? this.referencing : undefined,
    };
  }

  rangeParse(row: Row, domainType: CoverageJSON.DomainTypes) {
    const axisNames: { [x in CoverageJSON.DomainTypes]?: string[] } = {
      Point: ["t"],
      PointSeries: ["t"],
    };
    return this.parameters.reduce(
      (acc: CoverageJSON.Ranges, { id, targetAxis, dataType }) => {
        const values: any[] = row[id];
        if (!values) acc;
        acc[id] = {
          type: "NdArray",
          //@ts-ignore
          values,
          //Flawed implementation since it does not account for geometry characteristics
          axisNames: axisNames[domainType] || ["t"],
          //see above
          shape: [values.length], //[datetime.length],
          dataType,
        };
        return acc;
      },
      {}
    );
  }

  pointGeoJSONParser(
    { coordinates: [x, y, z] }: GeoJSON.Point,
    datetime: string[] = []
  ): CoverageJSON.Point | CoverageJSON.PointSeries {
    const domainType = datetime.length > 1 ? "PointSeries" : "Point";
    return {
      type: "Domain",
      domainType,
      //@ts-expect-error
      axes: {
        x: { values: [x] },
        y: { values: [y] },
        z: z ? { values: [z] } : undefined,
        t:
          //if domainType is Point,we cant just say {values:undefined}, thats not allowed
          domainType === "Point"
            ? datetime[0]
              ? { values: datetime }
              : undefined
            : { values: datetime },
      },
    };
  }

  multipointGeoJSONParser(
    { coordinates }: GeoJSON.MultiPoint,
    datetime: string[] = []
  ): CoverageJSON.MultiPoint | CoverageJSON.MultiPointSeries {
    const domainType = datetime.length > 1 ? "MultiPointSeries" : "MultiPoint";
    return {
      type: "Domain",
      domainType,
      axes: {
        composite: {
          coordinates: this.crs.hasZ ? ["x", "y", "z"] : ["x", "y"],
          //@ts-expect-error GeoJSON.Position uses number[]. CoverageJSON.Position uses [number,number,number?]
          values: coordinates,
        },
        t:
          domainType === "MultiPointSeries"
            ? { values: datetime }
            : datetime[0]
            ? { values: datetime }
            : undefined,
      },
    };
  }

  polygonGeoJSONParser(
    { coordinates }: GeoJSON.Polygon,
    datetime: string[] = []
  ): CoverageJSON.Polygon | CoverageJSON.PolygonSeries {
    const domainType = datetime.length > 1 ? "PolygonSeries" : "Polygon";
    return {
      type: "Domain",
      domainType,
      axes: {
        composite: {
          dataType: "polygon",
          coordinates: ["x", "y"],
          //@ts-expect-error
          values: coordinates,
        },
        t:
          domainType === "PolygonSeries"
            ? { values: datetime }
            : datetime[0]
            ? { values: datetime }
            : undefined,
      },
    };
  }

  multiPolygonGeoJSONParser(
    { coordinates }: GeoJSON.MultiPolygon,
    datetime: string[] = []
  ): CoverageJSON.MultiPolygon | CoverageJSON.MultiPolygonSeries {
    const domainType =
      datetime.length > 1 ? "MultiPolygonSeries" : "MultiPolygon";
    return {
      type: "Domain",
      domainType,
      axes: {
        composite: {
          dataType: "polygon",
          coordinates: ["x", "y"],
          //@ts-expect-error
          values: coordinates,
        },
        t:
          domainType === "MultiPolygonSeries"
            ? { values: datetime }
            : datetime[0]
            ? { values: datetime }
            : undefined,
      },
    };
  }

  /**
   * @unstable
   * Very experimental
   */
  lineStringGeoJSONParser(
    { coordinates }: GeoJSON.LineString,
    datetime: string[] = []
  ): CoverageJSON.Trajectory {
    return {
      type: "Domain",
      domainType: "Trajectory",
      axes: {
        composite: {
          dataType: "tuple",
          coordinates: this.crs.hasZ ? ["t", "x", "y", "z"] : ["t", "x", "y"],
          //@ts-expect-error
          values: coordinates.map((outer, i) => [datetime[i], ...outer]),
        },
      },
    };
  }

  public get referencing(): CoverageJSON.ReferenceSystemConnection[] {
    return [
      //Handle spatial values
      {
        system: { type: this.crs.type, id: this.crs.crs },
        // Dont know if separate coordinates needed for z axis
        coordinates: ["x", "y", "z"],
      },
      {
        system: { type: "TemporalRS", calendar: "Gregorian" },
        coordinates: ["t"],
      },
    ];
  }

  toCoverageCollection(): this {
    this.covjsonDoc = {
      type: "CoverageCollection",
      coverages: this.rows.map((r) => this.coverageParse(r, false)),
      parameters: this._parameters,
      referencing: this.referencing,
    };
    return this;
  }

  public get _parameters() {
    return this.parameters.reduce(
      (
        acc: { [x: string]: CoverageJSON.Parameter | EdrTypes.Parameter },
        { id, unit, observedProperty }
      ) => {
        acc[id] = {
          type: "Parameter",
          unit,
          observedProperty,
        };
        return acc;
      },
      {}
    );
  }

  toCoverage(): this {
    this.covjsonDoc = {
      ...this.coverageParse(undefined, true),
      parameters: this._parameters,
    };
    return this;
  }
  /*
  seriesChecker(
    type: Exclude<
      GeoJSON.GeoJsonGeometryTypes,
      "LineString" | "MultiLineString" | "GeometryCollection"
    >,
    datetime: string[]
  ) {
    let domainType: Exclude<
      CoverageJSON.DomainTypes,
      "Grid" | "Trajectory" | "VerticalProfile" | "Section"
    >;
    switch (type) {
      case "Point":
        domainType = datetime.length > 1 ? "PointSeries" : "Point";
        break;
      case "MultiPoint":
        domainType = datetime.length > 1 ? "MultiPointSeries" : "MultiPoint";
        break;
      case "Polygon":
        domainType = datetime.length > 1 ? "PolygonSeries" : "Polygon";
        break;
      case "MultiPolygon":
        domainType =
          datetime.length > 1 ? "MultiPolygonSeries" : "MultiPolygon";
        break;
      default:
        throw new HttpError(
          500,
          `Internal Server Error. Tried to map GeoJSON[${type}] geometries to a CoverageJSON Domain`
        );
    }
    return domainType;
  }
    */
}
