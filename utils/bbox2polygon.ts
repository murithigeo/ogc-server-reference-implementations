import type { Bbox } from "./types.d.ts";

export function bbox2polygon(bbox: Bbox): GeoJSON.Polygon {
  return {
    type: "Polygon",
    coordinates:
      bbox.length === 6
        ? //TODO verify that Polyhydrals are valid geojson
          [
            [
              //minx,miny,minz
              [
                bbox[0],
                bbox[1],
                //  bbox[2]
              ],
              //maxx,miny,maxz
              [
                bbox[3],
                bbox[1], //bbox[5]
              ],
              //maxx,maxy,maxz
              [
                bbox[3],
                bbox[4],
                // bbox[5]
              ],
              //minx,maxy,minz
              [
                bbox[0],
                bbox[4],
                //  bbox[2]
              ],
              //minx,miny,minz
              [
                bbox[0],
                bbox[1],
                //  bbox[2]
              ],
            ],
          ]
        : [
            [
              //minx,miny
              [bbox[0], bbox[1]],
              //maxx,miny
              [bbox[2], bbox[1]],
              //maxx,maxy
              [bbox[2], bbox[3]],
              //minx,maxy
              [bbox[0], bbox[3]],
              //minx,miny
              [bbox[0], bbox[1]],
            ],
          ],
  };
}
