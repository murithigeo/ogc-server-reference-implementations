import { numberReturned, type Bbox, type Feature } from "@template/utils";
import type { FeatureCollection } from "../types.d.ts";
import type { LineString, Point, MultiLineString } from "geojson";
import { buffer } from "@turf/buffer";
import bbox from "@turf/bbox";
import { fromFile as fromU } from "geotiff";

export function generateSamplePoints(
  xn = 0,
  yn = 0,
  zn = 0,
  bbox: [number, number, number, number, number, number]
): FeatureCollection<Point, { z: number[] }> {
  const features = Array<Feature<Point, { z: number[] }>>();
  const [xmin, ymin, zmin, xmax, ymax, zmax] = bbox;
  xn = xn - 1 < 0 ? 0 : xn - 1;
  yn = yn - 1 < 0 ? 0 : yn - 1;
  zn = zn - 1 < 0 ? 0 : zn - 1;

  const [dx, dy, dz] = [
    (xmax - xmin) / xn,
    (ymax - ymin) / yn,
    (zmax - zmin) / zn,
  ];
  const z = Array<number>();
  for (let _z = zmin; _z <= zmax; _z += dz) {
    z.push(_z);
  }
  for (let x = xmin; x <= xmax; x += dx) {
    for (let y = ymin; y < ymax; y += dy) {
      features.push({
        type: "Feature",
        properties: { z },
        geometry: {
          type: "Point",
          coordinates: [parseFloat(x.toFixed(6)), parseFloat(y.toFixed(6))],
        },
      });
    }
  }
  return {
    type: "FeatureCollection",
    features,
    timeStamp: new Date().toISOString(),
    numberMatched: features.length,
    numberReturned: numberReturned(features.length, features.length, 0),
  };
}

export function regularCorridor(
  coords: LineString | MultiLineString,
  width: number
) {
  const buffered = buffer(coords, width, { units: "meters" });
  if (!buffered)
    throw Error(`Unable to generate buffer around LineString/MultiLineString`);

  return bbox(buffered);
}

// // RASTERS

// export class GeoTiffHelper {
//   image: GeoTIFFImage;
//   constructor(image: GeoTIFFImage) {
//     this.image = image;
//   }
//   public get bbox() {
//     return this.image.getBoundingBox();
//   }
//   public get pixelPosition() {
//     return (position: [number, number]) => {
//       const widthPct =
//         (position[0] - this.bbox[0]) / (this.bbox[2] - this.bbox[0]);
//       const heightPct =
//         (position[1] - this.bbox[1]) / (this.bbox[3] - this.bbox[1]);

//       return [
//         Math.floor(this.image.getWidth() * widthPct),
//         Math.floor(this.image.getHeight() * (1 - heightPct)),
//       ];
//     };
//   }

//   public getData(bbox: Bbox, bandIndex: number = 0) {
//     return async (position: number[]) => {
//       const [xPx, yPx] = this.pixelPosition([position[0], position[1]]);
//       const data = await this.image.readRasters({
//         window: [xPx, yPx, xPx + 1, yPx + 1],
//         bbox,
//       });
//       return data[bandIndex];
//     };
//   }
// }

// export function

// class GeoTIFFImage extends GeoTImage {
//   constructor(...args: ConstructorParameters<typeof GeoTImage>) {
//     super(...args);
//   }
// }

export async function fromFile(...args: Parameters<typeof fromU>) {
  const res = await fromU(...args);

  return {
    ...res,
    getImage: async (index?: number) => {
      const image = await res.getImage(index);

      return {
        ...image,
        get bbox() {
          return image.getBoundingBox() as Bbox;
        },
        get pixelPosition() {
          return (position: [number, number]) => {
            const widthPct =
              (position[0] - this.bbox[0]) / (this.bbox[2] - this.bbox[0]);
            const heightPct =
              (position[1] - this.bbox[1]) / (this.bbox[3] - this.bbox[1]);

            return [
              Math.floor(image.getWidth() * widthPct),
              Math.floor(image.getHeight() * (1 - heightPct)),
            ];
          };
        },
        getData(bbox: Bbox, bandIndex: number = 0) {
          return async (position: number[]) => {
            const [xPx, yPx] = this.pixelPosition([position[0], position[1]]);
            const data = await image.readRasters({
              window: [xPx, yPx, xPx + 1, yPx + 1],
              bbox,
            });
            return data[bandIndex];
          };
        },
      };
    },
  };
}
