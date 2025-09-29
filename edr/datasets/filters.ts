import type { LineString, MultiLineString, MultiPoint, Point } from "geojson";
import { buffer } from "@turf/buffer";
import { intersects } from "@template/utils";
import { bbox2polygon, type Feature } from "@template/utils";
import { regularCorridor } from "./utils.ts";
export function corridorFilter(
  coords: LineString | MultiLineString,
  width: number
) {
  return (feature: Feature) => {
    //This is not a rectangle-ish meaning that we can't generate reliable randohm points
    const bboxed = bbox2polygon(regularCorridor(coords, width));
    return intersects(bboxed)(feature);
  };
}

export function radiusFilter(coords: Point | MultiPoint, within: number) {
  return (feature: Feature) => {
    const radius = buffer(coords, within, { units: "meters" });
    if (!radius) return true;
    return intersects(radius)(feature);
  };
}
