import proj4, { type ProjectionDefinition } from "proj4";
import type { Crs, Feature } from "./types.d.ts";
import type {EdrFeature} from "@template/edr"

export const crs = {
  "http://www.opengis.net/def/crs/OGC/1.3/CRS84": {
    type: "GeographicCRS",
    hasZ: false,
    srid: 4326,
    flipCoords: false,
  },
  // "http://www.opengis.net/def/crs/OGC/0/CRS84h": {
  //   type: "GeographicCRS",
  //   hasZ: true,
  //   srid: 4327,
  //   flipCoords: false,
  // },
  "http://www.opengis.net/def/crs/EPSG/0/4326": {
    type: "GeographicCRS",
    hasZ: false,
    srid: 4326,
    flipCoords: true,
  },
  // "http://www.opengis.net/def/crs/EPSG/0/32737": {
  //   type: "ProjectedCRS",
  //   hasZ: false,
  //   flipCoords: false,
  //   srid: 32737,
  // },
} satisfies { [x: string]: Crs };
export const CRS84 = Object.keys(crs)[0];
const cache = new Map<string, string | ProjectionDefinition | unknown>([
  ["ogc:CRS84", proj4.defs("EPSG:4326")],
  ["epsg:4326",proj4.defs("EPSG:4326")]
]);

const uriPrefix = "http://www.opengis.net/def/crs/";
function toAuthCode(uri: string): string {
  let authority: string;
  let code: string;
  if (!uri.startsWith(uriPrefix)) {
    //Assume its in form of <authority:code>
    [authority, code] = uri.split(":");
  }
  //http://www.opengis.net/def/crs/OGC/1.3/CRS84
  else [, , authority, , code] = new URL(uri).pathname.substring(1).split("/");
  return `${authority.toLowerCase()}:${code}`;
}

async function load(authcode: string) {
  console.log(authcode)
  const match = cache.get(authcode) || proj4.defs(authcode);
  if (match) return match;
  try {
    const [authority, code] = authcode.split(":");
    const res = await fetch(
      `https://spatialreference.org/ref/${authority}/${code}/prettywkt2.txt`
    );
    const projjson = await res.text();
    cache.set(authcode, projjson);
    return projjson;
  } catch (error) {
    console.error(
      `Failed to fetch projjson file for: ${authcode}. Using CRS84 instead`,
      error
    );
    return proj4.defs("EPSG:4326");
  }
}
for (const uri of Object.keys(crs)) {
  await load(toAuthCode(uri));
}
export function reprojectAndFlip<
  T extends GeoJSON.Geometry,
  P extends GeoJSON.GeoJsonProperties
>(from: keyof typeof crs, to: keyof typeof crs | string) {
  return (feature: Feature<T, P>|EdrFeature<T,P>) => {
    const geometry = feature.geometry;
    if (geometry.type === "GeometryCollection") return feature;
    const [, target] = [crs[from], crs[to]];

    const projector = proj4(
      cache.get(toAuthCode(from))!,
      cache.get(toAuthCode(to))
    );
    const enforceAxis = target.flipCoords;
    switch (geometry.type) {
      case "Point":
        geometry.coordinates = projector.forward(
          geometry.coordinates,
          enforceAxis
        );
        break;
      case "MultiPoint":
      case "LineString":
        geometry.coordinates = geometry.coordinates.map((coords) =>
          projector.forward(coords, enforceAxis)
        );
        break;
      case "MultiLineString":
      case "Polygon":
        geometry.coordinates = geometry.coordinates.map((inner) =>
          inner.map((coords) => projector.forward(coords, enforceAxis))
        );
        break;
      case "MultiPolygon":
        geometry.coordinates = geometry.coordinates.map((outer) =>
          outer.map((inner) =>
            inner.map((coords) => projector.forward(coords, enforceAxis))
          )
        );
        break;
    }
    feature.geometry = geometry;
    return feature;
  };
}
