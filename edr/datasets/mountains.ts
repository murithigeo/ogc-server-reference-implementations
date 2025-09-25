import {
  bbox2polygon,
  CRS84,
  numberReturned,
  reprojectAndFlip,
  intersects,
  elevationFilter,
} from "@template/utils";
import type { Dataset } from "../config.ts";
import type { EdrFeature, FeatureCollection } from "../types.d.ts";
import { mountains as mts } from "@template/data";
import { bbox } from "@turf/bbox";
import buffer from "@turf/buffer";
import { HttpError } from "exegesis";
const mountains = {
  ...mts,
  features: mts.features
    .map((p) => ({
      ...p,
      id: p.properties.name,
      properties: { ...p.properties, countries: p.properties.countries || [] },
    }))
    .sort((a, b) => a.properties.name.localeCompare(b.properties.name)),
};

export default {
  id: "world-mountains",
  crs: [CRS84, CRS84],
  output_formats: ["JSON", "GEOJSON", "HTML"],
  storageCrs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
  description: "Mountains",
  keywords: ["mountains"],
  parameters: [
    {
      id: "height",
      dataType: "float",
      unit: { label: { en: "Height in Metres", symbol: "m" } },
      observedProperty: {
        description: {
          en: "Height of Mountain in metres",
        },
        label: { en: "Height" },
        id: "http://codes.wmo.int/grib2/codeflag/4.2/0-3-6",
      },
    },
  ],
  getExtent() {
    return {
      id: "world-mountains",
      bbox: [bbox(mountains)],
      crs: CRS84,
      datetime: null,
      vrs: CRS84,
      z: mountains.features.map((f) => f.properties.meters),
    };
  },

  data_queries: {
    locations: {
      multi: true,
      output_formats: ["GEOJSON", "JSON"],
      default_output_format: "GEOJSON",
      allowAt: ["collection", "instance"],
      handler(opts) {
        const locationIds = Array.from(
          new Set(mountains.features.flatMap((p) => p.properties.countries))
        );
        if (opts.locationId) {
          const activeLocationIds = opts.locationId.split(",");
          const invalidLocationIds = activeLocationIds.filter(
            (p) => !locationIds.includes(p)
          );
          if (invalidLocationIds.length > 0) {
            throw new HttpError(404, invalidLocationIds.join(","));
          }
          const matched = mountains.features
            .filter(instanceIdChecker(opts.instanceId))
            .filter(intersects(opts.bbox))
            .filter((feat) =>
              activeLocationIds.every((v) =>
                feat.properties.countries.includes(v)
              )
            )
            .filter(elevationFilter(opts.z, "meters"));

          const limit = opts.limit || matched.length;
          const offset = opts.offset || 0;
          return {
            timeStamp: new Date().toJSON(),
            numberMatched: matched.length,
            numberReturned: numberReturned(matched.length, limit, offset),
            features: matched.slice(offset, offset + limit).map((feat) =>
              reprojectAndFlip(
                "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
                opts.crs
              )({
                ...feat,
                properties: {
                  ...feat.properties,
                  edrqueryendpoint: new URL(
                    `${opts.server}/collections/world-mountains${
                      opts.instanceId ? `/instances/${opts.instanceId}` : ""
                    }/locations/${feat.properties.continent}`
                  ).toJSON(),
                  datetime: "",
                  "parameter-name": [],
                  label: {
                    en: feat.properties.name,
                  },
                },
              })
            ),
            type: "FeatureCollection",
          };
        }
        const matched = Object.entries(
          Object.groupBy(
            mountains.features
              .filter(instanceIdChecker(opts.instanceId))
              .filter(intersects(opts.bbox))
              .flatMap((feat) =>
                (feat.properties?.countries).map((co) => ({
                  ...feat,
                  properties: {
                    ...feat.properties,
                    country: co,
                    elevations: feat.properties.meters,
                  },
                }))
              )
              .filter(elevationFilter(opts.z, "elevations")),
            ({ properties }) => properties.country
          )
        ).map(
          ([continent, features]): EdrFeature => ({
            type: "Feature",
            geometry: bbox2polygon(
              bbox({ type: "FeatureCollection", features: features! })
            ),
            id: continent,
            properties: {
              "parameter-name": [],
              datetime: "",
              label: { en: continent },
              edrqueryendpoint: new URL(
                `${opts.server}/collections/world-mountains${
                  opts.instanceId ? "/instances/" + opts.instanceId : ""
                }/locations/${encodeURI(continent)}`
              ).toString(),
            },
          })
        );
        const limit = opts.limit || matched.length;
        const offset = opts.offset || 0;
        return {
          type: "FeatureCollection",
          timeStamp: new Date().toJSON(),
          features: matched
            .slice(offset, limit + offset)
            .map(
              reprojectAndFlip(
                "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
                opts.crs
              )
            ),
          numberMatched: matched.length,
          numberReturned: numberReturned(matched.length, limit, offset),
        };
        // Multi
      },
    },
    instances: {
      default_instanceid: "Africa",
      default_output_format: "JSON",
      output_formats: ["JSON", "YAML"],
      allowAt: ["collection", "instance"],

      handler(opts) {
        return Object.entries(
          Object.groupBy(
            mountains.features.filter((c) => c.properties.continent !== null),
            ({ properties: { continent } }) => continent!
          )
        )
          .map(([continent, features]) => ({
            id: continent,
            datetime: null,
            bbox: [bbox({ type: "FeatureCollection", features: features! })],
            crs: CRS84,
            vrs: CRS84,
            z: features!.map((f) => f.properties.meters),
          }))
          .filter((p) => {
            if (opts.instanceId) return p.id === opts.instanceId;
            return true;
          });
      },
    },
    items: {
      allowAt: ["collection", "instance"],
      default_output_format: "GEOJSON",
      handler(opts) {
        const matched = mountains.features
          .filter((feat) =>
            !opts.itemId ? true : opts.itemId === feat.properties.name
          )
          .filter(intersects(opts.bbox))
          .filter(instanceIdChecker(opts.instanceId));
        const limit = opts.limit || matched.length,
          offset = opts.offset || 0;
        return {
          timeStamp: new Date().toJSON(),
          numberMatched: matched.length,
          numberReturned: numberReturned(matched.length, limit, offset),
          features: matched.slice(limit, offset + limit),
          type: "FeatureCollection",
        };
      },
      output_formats: ["JSON", "HTML"],
    },
    corridor: {
      width_units: ["meters"],
      height_units: ["meters"],
      allowAt: ["collection", "instance"],
      default_output_format: "GEOJSON",
      output_formats: ["GEOJSON", "JSON"],
      handler(opts) {
        // return this.output_formats
        const matched = mountains.features
          .filter(
            intersects(
              buffer(opts.coords, opts["corridor-width"], { units: "meters" })
            )
          )
          .filter(instanceIdChecker(opts.instanceId))
          .filter((feat) => feat.properties.meters <= opts["corridor-height"]);

        return {
          type: "FeatureCollection",
          numberMatched: matched.length,
          numberReturned: numberReturned(matched.length, matched.length, 0),
          timeStamp: new Date().toJSON(),
          features: matched.map(
            reprojectAndFlip(
              "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
              opts.crs
            )
          ),
        } satisfies FeatureCollection;
      },
    },
  },
} satisfies Dataset;

function instanceIdChecker(instanceId: string | undefined) {
  return (feature: (typeof mountains)["features"][0]) => {
    if (!instanceId) return true;
    return feature.properties.continent === instanceId;
  };
}
