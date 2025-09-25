import { isd_stations } from "@template/data";
import observedproperties from "./observedproperties.ts";
import type { Dataset } from "../config.ts";
import { crs, CRS84, CRS84h } from "@template/utils";
import units from "./units.ts";

const url = new URL(`https://ncei.noaa.gov/access/services/data/v1`);
// Update Frequency Medium
url.searchParams.set("dataset", "daily-summaries");
// Stations
url.searchParams.set("stations", isd_stations.map((p) => p.id).join(","));

//Dataset terminates on 2025-08-24
url.searchParams.set("startDate", new Date("2025-08-01").toISOString());
url.searchParams.set("format", "json");

const DAY_IN_MS = 24 * 60 * 1000;

setInterval(async () => {}, DAY_IN_MS);

const map = new Map<any, any>();
export default {
  id: "isd-kenya",
  description: "World Mountains provided through EDR endpoints",
  storageCrs: crs["http://www.opengis.net/def/crs/OGC/1.3/CRS84"],
  crs: [CRS84, CRS84h],
  getExtent: () => {},
  parameters: [
    {
      id: "temperature",
      unit: units.temperature,
      dataType: "float",
      observedProperty: observedproperties.temperature,
    },
    {
      id: "dewPointTemperature",
      unit: units.temperature,
      observedProperty: observedproperties.dewPointTemperature,
      dataType: "float",
    },
    {
      id: "pressure",
      unit: units.pressure,
      observedProperty: observedproperties.pressure,
      dataType: "float",
    },
    {
      id: "windDirection",
      unit: units.windDirection,
      observedProperty: observedproperties.windDirection,
      dataType: "float",
    },
    {
      id: "windType",
      unit: units.windType,
      observedProperty: observedproperties.windType,
      dataType: "string",
    },
    {
      id: "windSpeed",
      unit: units.windSpeed,
      observedProperty: observedproperties.windSpeed,
      dataType: "float",
    },
  ],
  data_queries: {},
} satisfies Dataset;
