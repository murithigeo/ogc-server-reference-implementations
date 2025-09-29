import { generateSamplePoints, regularCorridor } from "./utils.ts";
import type { Dataset } from "../config.ts";
import { fromFile } from "./utils.ts";
import { bbox } from "@turf/bbox";
import type { Coverage, CoverageCollection, PointSeries } from "coveragejson";
import { bbox2polygon, crs, reproject, type Datetime } from "@template/utils";
import path from "node:path";
import process from "node:process";
import type { FeatureCollection } from "@template/edr";

const refs = {
  "2025-01-01": "data/fapar/fpanv_m_gdo_20250101_t_300_z01.tif",
  "2025-01-11": "data/fapar/fpanv_m_gdo_20250111_t_300_z01.tif",
  "2025-01-21": "data/fapar/fpanv_m_gdo_20250121_t_300_z01.tif",
  "2025-02-01": "data/fapar/fpanv_m_gdo_20250201_t_300_z01.tif",
  "2025-02-11": "data/fapar/fpanv_m_gdo_20250211_t_300_z01.tif",
  "2025-02-21": "data/fapar/fpanv_m_gdo_20250221_t_300_z01.tif",
  "2025-03-01": "data/fapar/fpanv_m_gdo_20250301_t_300_z02.tif",
  "2025-03-11": "data/fapar/fpanv_m_gdo_20250311_t_300_z01.tif",
  "2025-03-21": "data/fapar/fpanv_m_gdo_20250321_t_300_z01.tif",
  "2025-04-01": "data/fapar/fpanv_m_gdo_20250401_t_300_z02.tif",
  "2025-04-11": "data/fapar/fpanv_m_gdo_20250411_t_300_z01.tif",
  "2025-04-21": "data/fapar/fpanv_m_gdo_20250421_t_300_z01.tif",
  "2025-05-01": "data/fapar/fpanv_m_gdo_20250501_t_300_z01.tif",
  "2025-05-11": "data/fapar/fpanv_m_gdo_20250511_t_300_z01.tif",
  "2025-05-21": "data/fapar/fpanv_m_gdo_20250521_t_300_z01.tif",
  "2025-06-01": "data/fapar/fpanv_m_gdo_20250601_t_300_z02.tif",
  "2025-06-11": "data/fapar/fpanv_m_gdo_20250611_t_300_z02.tif",
  "2025-06-21": "data/fapar/fpanv_m_gdo_20250621_t_300_z03.tif",
  "2025-07-01": "data/fapar/fpanv_m_gdo_20250701_t_300_z01.tif",
  "2025-07-11": "data/fapar/fpanv_m_gdo_20250711_t_300_z02.tif",
  "2025-07-21": "data/fapar/fpanv_m_gdo_20250721_t_300_z01.tif",
  "2025-08-01": "data/fapar/fpanv_m_gdo_20250801_t_300_z01.tif",
  "2025-08-11": "data/fapar/fpanv_m_gdo_20250811_t_300_z01.tif",
  "2025-08-21": "data/fapar/fpanv_m_gdo_20250821_t_300_z02.tif",
  "2025-09-01": "data/fapar/fpanv_m_gdo_20250901_t_300_z01.tif",
};

const cache = new Map<
  string,
  Awaited<ReturnType<Awaited<ReturnType<typeof fromFile>>["getImage"]>>
>();

for (const k of Object.keys(refs)) {
  cache.set(
    k,
    await (await fromFile(path.join(process.cwd(), refs[k]))).getImage()
  );
}
const [resX, resY] = [10, 10];
const viParameter = {
  id: "vegetationindex",
  dataType: "float",
  unit: {
    label: { en: "Vegetation Index" },
    id: "https://drought.emergency.copernicus.eu/data/factsheets/factsheet_fapar_viirs.pdf",
    symbol: "",
  },
  observedProperty: {
    description: { en: "Impact of agricultural drought on vegetation" },
    label: { en: "Agricultural Drought Impact Index" },
  },
} as Dataset["parameters"][0];
export default {
  id: "fapar-anomaly",
  crs: ["OGC:CRS84", "EPSG:4326"],
  storageCrs: "OGC:CRS84",
  parameters: [viParameter],
  data_queries: {
    instances: {
      allowAt: ["collection", "instance"],
      default_output_format: "JSON",
      handler(opts) {
        return Object.keys(refs)
          .filter(instanceIdFilter(opts.instanceId))
          .filter(datetimeFilter(opts.datetime))
          .map((id) => {
            const bbox = cache.get(id)!.bbox;
            const [dx, dy] = [
              (bbox[2] - bbox[0]) / resX,
              (bbox[3] - bbox[1]) / resY,
            ];
            return {
              id,
              spatial: {
                bbox: [bbox],
                crs: "OGC:CRS84",
                values: {
                  x: [`R${resX}/${bbox[0]}/${dx}`],
                  y: [`R${resY}/${bbox[1]}/${dy}`],
                },
              },
              temporal: [id],
            };
          });
      },
      default_instanceid: Object.keys(refs).slice(-1)[0],
    },
    corridor: {
      allowAt: ["instance", "collection"],
      default_output_format: "COVERAGEJSON",
      output_formats: ["COVERAGEJSON"],
      height_units: ["meters", "kilometers"],
      width_units: ["meters", "kilometers"],
      async handler(opts) {
        const bbox = regularCorridor(opts.coords, opts["corridor-width"]);
        const samplingPoints = generateSamplePoints(
          (opts["resolution-x"] = resX),
          (opts["resolution-y"] = resY),
          (opts["resolution-z"] = 10),
          [bbox[0], bbox[1], 0, bbox[2], bbox[3], 0]
        );
        // lets return coveragejson first
        const d: CoverageCollection = {
          type: "CoverageCollection",
          coverages: [],
          parameters: {
            vegationindex: {
              type: "Parameter",
              observedProperty: { label: { en: "VegationIndex" } },
              description: {
                en: "The Impact of Agricultural Drought on Vegetation",
              },
              unit: {
                label: { en: "Impact Index" },
                symbol: "",
              },
            },
          },
          referencing: [
            {
              system: { id: crs[opts.crs]["uri"], type: "GeographicCRS" },
              coordinates: ["x", "y"],
            },
            {
              system: { calendar: "Gregorian", type: "TemporalRS" },
              coordinates: ["t"],
            },
          ],
        };
        for (const point of samplingPoints.features) {
          const datesToQuery = Object.keys(refs).filter(instanceIdFilter);
          const coverage: Coverage<PointSeries | CoverageJSON.Point> = {
            type: "Coverage",
            domain: {
              type: "Domain",
              domainType: datesToQuery.length < 2 ? "Point" : "PointSeries",
              axes: {
                x: { values: [point.geometry.coordinates[0]] },
                y: { values: [point.geometry.coordinates[1]] },
                t: {
                  values:
                    datesToQuery.length > 2 ? datesToQuery : [datesToQuery[0]],
                },
              },
            },
            ranges: {},
          };
          const values = Array<string | null | number>();
          for (const k of datesToQuery) {
            const image = cache.get(k)!;
            const data = await image.getData(
              bbox,
              0
            )(reproject(opts.crs, "OGC:CRS84")(point).geometry.coordinates);
            values.push(data[0]);
          }
          coverage.ranges["vegetationindex"] = {
            type: "NdArray",
            dataType: "float",
            axisNames: ["t"],
            values,
            shape: [values.length],
          };
          d.coverages.push(coverage);
        }
        return d;
      },
    },
  },
  keywords: ["fapar", "vegetation index"],
  output_formats: ["GEOJSON", "COVERAGEJSON"],
  getExtent() {
    const geometries: GeoJSON.GeometryCollection = {
      type: "GeometryCollection",
      geometries: Object.keys(refs).map((p) =>
        bbox2polygon(cache.get(p)!.bbox)
      ),
    };
    const _bbox = bbox(geometries);
    const [dx, dy] = [_bbox[2] / _bbox[0] / resX, (_bbox[3] - _bbox[1]) / resY];
    return {
      id: this.id,
      spatial: {
        bbox: [_bbox, ...geometries.geometries.map((p) => bbox(p))],
        crs: this.storageCrs,
        values: {
          x: [`R${resX}/${_bbox[0]}/${dx}`],
          y: [`R${resY}/${_bbox[1]}/${dy}`],
        },
      },
      temporal: Object.keys(refs),
    };
  },
  description: "",
} satisfies Dataset;

function instanceIdFilter(instanceId: string | undefined) {
  return (date: string) => {
    if (!instanceId) return true;
    return instanceId === date;
  };
}

function datetimeFilter(datetime: Datetime | undefined) {
  return (date: string) => {
    if (!datetime) return true;
    // if(datetime.min)
    let mincheck = true;
    let maxcheck = true;
    let valuecheck = true;
    if (datetime.max)
      maxcheck = new Date(datetime.max).getTime() >= new Date(date).getTime();
    if (datetime.min)
      mincheck = new Date(datetime.min).getTime() <= new Date(date).getTime();
    if (datetime.values)
      valuecheck = datetime.values
        .map((v) => new Date(v).getTime())
        .includes(new Date().getTime());
    return valuecheck && mincheck && maxcheck;
  };
}

async function toCoverageJSON(
  dates: string[],
  samplepoints: FeatureCollection<GeoJSON.Point>,
  includeValues: boolean
): CoverageCollection<Coverage<PointSeries>> {
  for (const date of dates) {
    const image = cache.get(date)!;
  }
}

async function toGeoJSON(
  dates: string[],
  samplepoints: FeatureCollection<GeoJSON.Point>
) {}
