import {
  bbox2polygon,
  CRS84,
  numberReturned,
  reproject,
  intersects,
  elevationFilter,
  datetimeFilter,
} from "@template/utils";
import type { Dataset } from "../config.ts";
import type { EdrFeature, FeatureCollection } from "../types.d.ts";
import { mountains as mts } from "@template/data";
import { bbox } from "@turf/bbox";
import { HttpError } from "exegesis";
import { corridorFilter, radiusFilter } from "./filters.ts";
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
  crs: ["OGC:CRS84", "EPSG:4326"],
  output_formats: ["JSON", "GEOJSON", "HTML"],
  storageCrs: "OGC:CRS84",
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
      spatial: {
        bbox: [bbox(mountains)],
        crs: "OGC:CRS84",
      },
      vertical: {
        vrs: CRS84,
        values: mountains.features.map((f) => f.properties.meters),
      },
      temporal: null,
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
            .filter(elevationFilter(opts.z, "meters"))
            .filter(intersects(opts.bbox))
            .filter((feat) =>
              activeLocationIds.every((v) =>
                feat.properties.countries.includes(v)
              )
            );

          const limit = opts.limit || matched.length;
          const offset = opts.offset || 0;
          return {
            timeStamp: new Date().toJSON(),
            numberMatched: matched.length,
            numberReturned: numberReturned(matched.length, limit, offset),
            features: matched.slice(offset, offset + limit).map((feat) =>
              reproject(
                "OGC:CRS84",
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
            .map(reproject("OGC:CRS84", opts.crs)),
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
            mountains.features
              .filter((c) => c.properties.continent !== null)
              .filter(instanceIdChecker(opts.instanceId)),
            ({ properties: { continent } }) => continent!
          )
        ).map(([continent, features]) => ({
          id: continent,
          temporal: null,
          spatial: {
            bbox: [bbox({ type: "FeatureCollection", features: features! })],
            crs: "OGC:CRS84",
          },
          vertical: {
            vrs: CRS84,
            values: features!.map((f) => f.properties.meters),
          },
        }));
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
          .filter((feat) => feat.properties.meters <= opts["corridor-height"])
          .filter(instanceIdChecker(opts.instanceId))
          .filter(corridorFilter(opts.coords, opts["corridor-width"]));

        return {
          type: "FeatureCollection",
          numberMatched: matched.length,
          numberReturned: numberReturned(matched.length, matched.length, 0),
          timeStamp: new Date().toJSON(),
          features: matched.map(reproject("OGC:CRS84", opts.crs)),
        } satisfies FeatureCollection;
      },
    },
    trajectory: {
      default_output_format: "GEOJSON",
      allowAt: ["collection", "instance"],
      handler(opts) {
        const matched = mountains.features
          .filter(instanceIdChecker(opts.instanceId))
          .filter(datetimeFilter(opts.datetime))
          .filter(elevationFilter(opts.z, "meters"))
          .filter(intersects(opts.coords));

        return {
          timeStamp: new Date().toISOString(),
          type: "FeatureCollection",
          numberMatched: matched.length,
          numberReturned: numberReturned(matched.length, matched.length, 0),
          features: matched.map(reproject("OGC:CRS84", opts.crs)),
        };
      },
    },
    radius: {
      allowAt: ["collection", "instance"],
      default_output_format: "GEOJSON",
      output_formats: ["GEOJSON", "JSON"],
      within_units: ["meters"],
      handler(opts) {
        const matched = mountains.features
          .filter(instanceIdChecker(opts.instanceId))
          .filter(datetimeFilter(opts.datetime))
          .filter(elevationFilter(opts.z, "meters"))
          .filter(radiusFilter(opts.coords, opts.within));
        return {
          type: "FeatureCollection",
          timeStamp: new Date().toISOString(),
          numberMatched: matched.length,
          numberReturned: numberReturned(matched.length, matched.length, 0),
          features: matched.map(reproject("OGC:CRS84", opts.crs)),
        };
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
