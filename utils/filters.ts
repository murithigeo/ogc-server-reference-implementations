import type {
  Bbox,
  Datetime,
  Elevation,
  Feature,
  GeoJsonProperties,
} from "./types.d.ts";
import booleanIntersects from "@turf/boolean-intersects";
import { bbox2polygon } from "./bbox2polygon.ts";
import type { ifError } from "node:assert";

export function filterByDatetime(
  tvalues: string[] | null,
  datetime: {
    min?: string;
    max?: string;
    values?: string[];
  }
) {
  if (!tvalues) return true;
  tvalues.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  let max = true;
  let min = true;
  let values = true;

  const [tmin, tmax] = [tvalues[0], tvalues[tvalues.length - 1]];

  if (tmin && datetime.min) {
    min = new Date(tmin).getDate() >= new Date(datetime.min).getTime();
  }

  if (tmax && datetime.max) {
    max = new Date(tmax).getTime() <= new Date(datetime.max).getTime();
  }

  if (tvalues && datetime.values) {
    values = datetime.values.every((val) =>
      tvalues!
        .map((t) => new Date(t).getTime())
        .includes(new Date(val).getTime())
    );
  }

  return min && max && values;
}
/**
 *
 * @param bbox1 [xmin,ymin,xmax,ymax]
 * @param bbox2 [xmin,ymin,xmax,ymax]
 */
export function filterByBbox(bbox1: Bbox, bbox2?: Bbox) {
  if (!bbox2) return true;
  return booleanIntersects(bbox2polygon(bbox1), bbox2polygon(bbox2));
}
export function filterByElevation(
  zvalues: number[] | null,
  z?: {
    max?: number;
    min?: number;
    values?: number[];
  }
) {
  if (!zvalues) return;
  zvalues.sort((a, b) => a - b);
  const [zmin, zmax] = [zvalues[0], zvalues[zvalues.length - 1]];
  let max = true;
  let min = true;
  let values = true;

  if (zmin && z?.min) min = zmin >= z.min;

  if (max && z?.max) max = zmax <= z.max;

  if (zvalues && z?.values)
    values = zvalues.every((val) => zvalues?.includes(val));

  return min && max && values;
}

export function intersects(bbox?: GeoJSON.Feature | GeoJSON.Geometry) {
  return (geom: GeoJSON.Feature | GeoJSON.Geometry) => {
    if (!bbox) return true;
    return booleanIntersects(geom, bbox);
  };
}

export function elevationFilter<
  G extends GeoJSON.Geometry,
  P extends GeoJSON.GeoJsonProperties
>(z?: Elevation, field?: keyof P) {
  return (feature: GeoJSON.Feature<G, P>) => {
    if (!z) return true;
    if (
      Array<GeoJSON.GeoJsonGeometryTypes>(
        "MultiPolygon",
        "Polygon",
        "GeometryCollection"
      )
    ) {
      return true;
    }

    let values: number[] = [];
    if (field && feature.properties) {
      const v = feature.properties[field];
      values = Array.isArray(v) ? v.map((p) => parseFloat(p)) : [parseFloat(v)];
    } else {
      switch (feature.geometry.type) {
        case "Point":
          values = [feature.geometry.coordinates[3]]; //.filter(value => value !== undefined);
          break;
        case "MultiPoint":
        case "LineString":
          values = feature.geometry.coordinates.flatMap((outer) => outer[3]);
          break;
        case "MultiLineString":
          values = feature.geometry.coordinates.flatMap((outer) =>
            outer.map((inner) => inner[3])
          );
          break;
        default:
          return true;
      }
    }
    values = values.sort((a, b) => a - b).filter((v) => v !== undefined);
    let levelcheck = true;
    let mincheck = true;
    let maxcheck = true;
    if (z.max) maxcheck = values.some((v) => v <= z.max!);
    if (z.min) mincheck = values.some((v) => z.min! <= v);
    if (z.values) levelcheck = values.some((v) => z.values?.includes(v));
    return levelcheck && mincheck && maxcheck;
  };
}

export function datetimeFilter<
  G extends GeoJSON.Geometry,
  P extends GeoJsonProperties
>(datetime?: Datetime, field?: string) {
  return (feature: Feature<G, P>) => {
    if (!datetime || !field) return true;
    const values_ = feature.properties[field];

    const values = Array.isArray(values_) ? values_ : [values_];
    values.map((p) => new Date(p).getTime()).sort((a, b) => a - b);
    if (datetime.min) return datetime.min <= values[0];
    if (datetime.max) return datetime.max >= values[values.length - 1];
    if (datetime.values) return datetime.values.some((v) => values.includes(v));
  };
}
