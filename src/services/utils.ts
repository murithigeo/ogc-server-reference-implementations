import { sql, type ExpressionWrapper } from "kysely";
import { bboxToPolygon } from "../common/common.utils.js";
import type { Database } from "../models/db.js";
import { stf as _stf } from "../models/kysely-postgis/functions.js";
import type { SqlBool } from "kysely";
import type { ReferenceExpression } from "kysely";
import type { ExpressionBuilder } from "kysely";
import type { EdrRqManager } from "../standards/edr/edr.utils.js";

/**
 * Returns an array of boolean conditions of geometries inside a 2D space
 */
export function bboxFilter<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>,
  storageSRID: number,
  bboxCrs?: CommonTypes.CrsConfig,
  bbox?: CommonTypes.Bbox
) {
  //if (!bbox) return;
  const conditions: ExpressionWrapper<DB, TB, SqlBool>[] = [];
  if (bbox) {
    const stf = _stf(eb);
    const step1 = bboxToPolygon(bbox);
    //Geojson to geometry
    const step2 = stf.geomFromGeoJSON(step1);
    //set srid of bbox
    const step3 = stf.setSRID(step2, bboxCrs?.srid!);
    //transform bbox geometry to storage srid
    const step4 = stf.transform(step3, storageSRID);
    //set srid of stored geometry
    const step5 = stf.setSRID(geomColumn, storageSRID);

    conditions.push(stf.intersects(step5, step4));
  }
  return conditions;
}

/**
 * Creates a boolean condition to filter vector features intersecting with a Polygon geometry
 * @param srid the srid of the geometry column
 */
export function areaFilter<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>,
  coords: EdrRqManager["coords"],
  srid: number,
  crs: CommonTypes.CrsConfig
) {
  const { geomFromText, flipCoordinates, setSRID, transform, intersects } =
    _stf(eb);
  //geometry from text
  const step1 = geomFromText(coords.wkt, { srid: crs.srid });
  //POSTGIS uses x,y
  const step1_5 = crs.flipCoords ? flipCoordinates(step1) : step1;
  //transform to storage srid
  const step2 = transform(step1_5, srid);
  //set srid of the geometry column
  const step3 = setSRID(geomColumn, srid);

  return intersects(step2, step3);
}

/**
 * @param eb expression builder method
 * @param column name of the data column
 * @param dataType the data type of the data, Either string,float or integer. Used to cast the value
 * @param index Indicates column is an array column thus use an accessor
 */

export function paramValueFromColumn<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  column: ReferenceExpression<DB, TB>,
  dataType: CoverageJSON.NdArray["dataType"],
  index?: number
) {
  return eb.cast<string | null | number>(
    //@ts-expect-error: <kysely does not like this>
    sql<string | null | number>(index ? `${column}[${index}]` : column),
    dataType === "string"
      ? "varchar"
      : dataType === "float"
      ? "float4"
      : "integer"
  );
}

/**
 * Returns an array of boolean conditions filtering records by their temporal properties
 * @param datetime.max the maximum temporal value
 * @param datetime.min the smallest temporal value
 * @param datetime.levels Return records whose temporal values are in the array
 */
export function datetimeFilter<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  datetimeColumn: ReferenceExpression<DB, TB>,
  datetime?: EdrRqManager["datetime"]
) {
  const conditions: ExpressionWrapper<Database, keyof Database, SqlBool>[] = [];
  if (!datetime) return conditions;

  //Return data where datetime are in specified list
  //! Given we are working with timestamps, remember that blogpost about POSTGRES rookie mistakes
  datetime.levels
    ? conditions.push(eb(datetimeColumn, "in", datetime.levels))
    : undefined;
  //Return dates where upper limit is known
  datetime.max
    ? conditions.push(eb(datetimeColumn, "<=", datetime.max))
    : undefined;
  //Return dates where lower limit is known
  datetime.min
    ? conditions.push(eb(datetimeColumn, ">=", datetime.min))
    : undefined;
  return conditions;
}

/**
 *
 */
export function zFilter<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>,
  z?: EdrRqManager["z"]
) {
  //create an instance of stf
  const { z: zAttr, force3d } = _stf(eb);
  //If zfilter is specified, then force the column to 3D
  const geomRef = zAttr(force3d(geomColumn));
  // Get the height dimension of the column

  const conditions: ExpressionWrapper<Database, keyof Database, SqlBool>[] = [];
  if (!z) return conditions;
  //If levels, return geometries whose z value is in requested array
  z.levels ? conditions.push(eb(geomRef, "in", z.levels)) : undefined;
  //if max height, return geometries whose z value is less or equal to max height
  z.max ? conditions.push(eb(geomRef, "<=", z.max)) : undefined;
  //if min height, return geometries whose z value is greater or equal to min height
  z.min ? conditions.push(eb(geomRef, "<=", z.min)) : undefined;
  return conditions;
}

export function nonNullGeometryFilter<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>
) {
  return eb(geomColumn, "is not", null);
}

/**
 * @param crs object describing the requested crs
 * @param srid the srid of the geometry column
 */
export function transformGeometry<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB> | GeoJSON.Geometry,
  crs: CommonTypes.CrsConfig,
  srid: number
) {
  const { setSRID, transform, force2d, force3d, flipCoordinates } = _stf(eb);
  //Force the column's geometries to the same srid
  const step1 = setSRID(geomColumn, srid);
  // transform the geometries to the srid describing requested crs
  const step2 = transform(step1, crs.srid);
  // if the crs has a height dimension, force the geometry to have a height dimension
  const step3 = crs.hasZ ? force3d(step2) : force2d(step2);
  // POSTGIS uses [x,y] axis order, if the requested crs uses [y,x] flip the order.
  // preserves the 3D axis
  const step4 = crs.flipCoords ? flipCoordinates(step3) : step3;
  return step4;
}

/**
 * A helper to get geometries as GeoJSON geometries
 */
export function transformAsGeoJSON<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  // ...args: Parameters<typeof transformGeometry>
  fn: ReturnType<typeof transformGeometry>
) {
  return _stf(eb).asGeoJSON(fn).as("geom");
}

/**
 *
 */
export function corridorFilter<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>,
  coords: EdrRqManager["coords"],
  corridor: EdrRqManager["corridor"],
  crs: CommonTypes.CrsConfig,
  srid: number
) {
  const { geomFromText, dWithin, transform, setSRID, flipCoordinates } =
    _stf(eb);
  //get geometry from wkt;
  const step1 = geomFromText(coords.wkt, { srid: crs.srid, validate: false });
  //POSTGIS uses xy
  const step1_5 = crs.flipCoords ? flipCoordinates(step1) : step1;
  //transform geom to uniform srid
  const step2 = transform(step1_5, 3857);
  //set srid of storage geometry
  const step3 = setSRID(geomColumn, srid);
  //use EPSG:3857 for accurate buffering
  const step4 = transform(step3, 3857);
  //Get geometries within a certain distance of the linestring
  const widthQuery = dWithin(step4, step2, corridor.width);

  //!Remember that linestrings can have z and m axis
  //Reuse the zFilter for the height filter
  const heightQuery = zFilter(eb, geomColumn, {
    max: corridor.height,
    min: undefined,
    levels: undefined,
  });

  return [widthQuery, ...heightQuery];
}

/**
 * Get geometries at wtk
 * @param srid storage srid
 */
export function positionFilter<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>,
  coords: EdrRqManager["coords"],
  crs: CommonTypes.CrsConfig,
  srid: number
) {
  const { transform, geomFromText, setSRID, intersects, flipCoordinates } =
    _stf(eb);
  //wkt->geometry
  const step1 = geomFromText(coords.wkt, { srid: crs.srid });
  //POSTGIS uses x,y thus non-xy crs must be accounted for
  const step1_5 = crs.flipCoords ? flipCoordinates(step1) : step1;
  //crs[srid]->srid
  const step2 = transform(step1_5, srid);
  //setsrid
  const step3 = setSRID(geomColumn, srid);
  //Intersection //! Remember to account for 3D geometries
  return intersects(step3, step2);
}

/**
 * Since there are various crs units, radius.within should be in metres;
 *@param srid storage srid
 */
export function radiusFilter<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>,
  coords: EdrRqManager["coords"],
  radius: EdrRqManager["radius"],
  crs: CommonTypes.CrsConfig,
  srid: number
) {
  const { dWithin, geomFromText, transform, setSRID, flipCoordinates } =
    _stf(eb);
  const step1 = geomFromText(coords.wkt, { srid: crs.srid });
  //POSTGIS uses x,y thus non-xy crs must be accounted for
  const step1_5 = crs.flipCoords ? flipCoordinates(step1) : step1;
  const step2 = transform(step1_5, 3857);
  const step3 = setSRID(geomColumn, srid);
  const step4 = transform(step3, 3857);
  const step5 = dWithin(step2, step4, radius.within);
  return step5;
}

/**
 * Similar to @function corridorFilter but uses a simple intersection check
 * @param srid column srid
 */
export function trajectoryFilter<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>,
  coords: EdrRqManager["coords"],
  crs: CommonTypes.CrsConfig,
  srid: number
) {
  const {
    geomFromText,
    transform,
    intersects,
    setSRID,
    intersects3d,
    flipCoordinates,
  } = _stf(eb);

  //Get the geometry from text
  const step1 = geomFromText(coords.wkt, { srid: crs.srid });
  //POSTGIS uses x,y thus non-xy crs must be accounted for
  const step1_5 = crs.flipCoords ? flipCoordinates(step1) : step1;
  //transform the geometry to srid
  const step2 = transform(step1_5, srid);
  //set srid
  const step3 = setSRID(geomColumn, srid);
  //Intersection
  return crs.hasZ ? intersects3d(step3, step2) : intersects(step2, step3);
}

/**
 * Helper to generate tmin(smallest datetime value),tmax (largest datetime value),tvalues(list of unique temporal values)
 */
export function tExtent<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  datetimeColumn?: ReferenceExpression<DB, TB>,
  includeTvalues: boolean = true
) {
  return [
    //If column is non-existent, return null as tmax
    eb.fn.max<string | null>(datetimeColumn ?? eb.lit(null)).as("tmax"),
    //If column is non-existent, return null as tmin
    eb.fn.min<string | null>(datetimeColumn ?? eb.lit(null)).as("tmin"),
    // List of temporal unique values or null TODO: Use array slice operator to guarantee an array instead of null
    includeTvalues
      ? (datetimeColumn
          ? eb.fn.agg<string[]>("ARRAY_AGG", [datetimeColumn]).distinct()
          : eb.lit(null)
        ).as("tvalues")
      : undefined,
  ].filter((c) => c !== undefined);
}
/**
 * Returns the zmax,zmin,zvalues of a geometrical column
 */
export function zExtent<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>
) {
  const { z, force3d } = _stf(eb);
  const step1 = force3d(geomColumn);
  const step2 = eb.cast<number>(z(step1), "float4");
  return [
    eb.fn.max(step2).as("zmax"),
    eb.fn.min(step2).as("zmin"),
    eb.fn.jsonAgg(step2).distinct().as("zvalues"),
  ];
}

/**
 * Generates a spatial extent of a column
 */

export function geomBounds<DB extends Database, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomColumn: ReferenceExpression<DB, TB>,
  crs: CommonTypes.CrsConfig,
  srid: number
) {
  //Strategy
  const stf = _stf(eb);

  ////In the absence of data, the column can be null thus we need a fallback geometry to get the bounds from
  //turf/boolean-Intersects still works null geometries
  /*
  const fallbackGeometry = transformGeometry(
    eb,
    bboxToPolygon([-180, -90, 0, 180, 90, 0]),
    crs,
    4327
  );
*/
  const columnBounds = transformGeometry(eb, geomColumn, crs, srid);
  const geomBounds = stf.extent(columnBounds);
  //Remember that zExtent may not use the values here
  return [
    stf.xMax(geomBounds).as("xmax"),
    stf.xMin(geomBounds).as("xmin"),
    stf.yMin(geomBounds).as("ymin"),
    stf.yMax(geomBounds).as("ymax"),
  ];
}
/*
class RasterHandler {
  url: string;
  samplingPoints:GeoJSON.Point
  constructor({ url }: { url: string,samplingPoints:GeoJSON.Point[] }) {
    if (URL.canParse(url)) throw new Error(`Cannot read raster from ${url}`);
    this.url = url;
  }
  raster=fromUrl(this.url)

}
*/
