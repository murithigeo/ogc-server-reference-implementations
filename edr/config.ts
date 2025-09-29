import type {
  CoverageCollection,
  I18N,
  ObservedProperty,
  Unit,
} from "coveragejson";
import type { Length } from "convert";
import mountains from "./datasets/mountains.ts";
import type { contenttypes } from "../utils/constants.ts";
import type { Bbox, crs, Datetime, Link } from "@template/utils";
import type { EdrFeatureCollection, FeatureCollection } from "./types.d.ts";
import faparanomaly from "./datasets/faparanomaly.ts";

// //@external https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation
export default {
  datasets: [mountains, faparanomaly],
} as Config;

export type Dataset = {
  attribution?: Link[];
  id: string;
  description: string;
  output_formats: Array<keyof typeof contenttypes>;
  title?: string;
  crs: Array<keyof typeof crs>;
  storageCrs: keyof typeof crs;
  keywords: string[];
  parameters: Array<{
    id: string;
    unit?: Unit;
    dataType: "string" | "float" | "integer";
    observedProperty: ObservedProperty;
    description?: I18N;
    label?: I18N;
  }>;
  data_queries: DataQueryConfig;
  getExtent: () => ExtentProps;
};
export type Config = {
  datasets: Array<Dataset>;
};

export type ExtentProps = {
  id: string;
  spatial: {
    bbox: Bbox[];
    values?: { x: string[]; y: string[] };
    crs: keyof typeof crs;
  };
  vertical?: {
    values: number[];
    vrs: string;
  };
  temporal: string[] | null;
};

export type DataQueryProps = {
  output_formats?: Array<keyof typeof contenttypes>;
  default_output_format: keyof typeof contenttypes;
  allowAt: Array<"collection" | "instance">;
};

export type DataQueryConfig = {
  locations?: DataQueryProps & {
    multi?: boolean;
    handler: (
      opts: LocationsQueryOptions
    ) => EdrFeatureCollection | FeatureCollection;
  };
  instances?: DataQueryProps & {
    default_instanceid: string;
    handler: (opts: InstanceQueryOptions) => Array<ExtentProps>;
  };
  radius?: DataQueryProps & {
    within_units: Array<Length>;
    handler: (
      opts: RadiusQueryOptions
    ) => FeatureCollection | EdrFeatureCollection | CoverageCollection;
  };
  corridor?: DataQueryProps & {
    handler: (
      opts: CorridorQueryOptions
    ) => Promise<CoverageCollection | FeatureCollection>;
    width_units: Array<Length>;
    height_units: Array<Length>;
  };
  cube?: DataQueryProps & {
    handler: <T>(opts: CubeQueryOptions) => Promise<T> | T;
  };
  area?: DataQueryProps & {
    handler: <T>(opts: AreaQueryOptions) => Promise<T> | T;
  };
  trajectory?: DataQueryProps & {
    handler: (
      opts: TrajectoryQueryOptions
    ) => CoverageCollection | EdrFeatureCollection | FeatureCollection;
  };
  position?: DataQueryProps & {
    handler: <T>(
      opts: PositionQueryOptions
    ) => Promise<FeatureCollection | EdrFeatureCollection | CoverageCollection>;
  };
  items?: DataQueryProps & {
    handler: (
      opts: ItemsQueryOptions
    ) => CoverageCollection | EdrFeatureCollection | FeatureCollection;
  };
};

type BaseQueryOptions = {
  format?: keyof typeof contenttypes;
  datetime?: Datetime;
  z?: { min?: number; max?: number; values?: number[] };
  crs: keyof typeof crs;
  server: string;
  instanceId?: string;
  parameters?: string[];
};
type ItemsQueryOptions = BaseQueryOptions & {
  bbox?: GeoJSON.Polygon;
  itemId?: string;
  limit?: number;
  offset?: number;
};
type InstanceQueryOptions = BaseQueryOptions & {
  bbox?: GeoJSON.Polygon;
};

type TrajectoryQueryOptions = BaseQueryOptions & {
  coords: GeoJSON.LineString | GeoJSON.MultiLineString;
};
type AreaQueryOptions = BaseQueryOptions & {
  coords: GeoJSON.Polygon;
  "resolution-x"?: number;
  "resolution-y"?: number;
  // "resolution-z"?: number;
};
type CubeQueryOptions = BaseQueryOptions & {
  bbox: GeoJSON.Polygon;
};
type CorridorQueryOptions = BaseQueryOptions & {
  "corridor-width": number;
  "corridor-height": number;
  "resolution-x"?: number;
  "resolution-y"?: number;
  "resolution-z"?: number;
  coords: GeoJSON.MultiLineString | GeoJSON.LineString;
};

type RadiusQueryOptions = BaseQueryOptions & {
  within: number;
  coords: GeoJSON.Point | GeoJSON.MultiPoint;
};
type PositionQueryOptions = BaseQueryOptions & {
  coords: GeoJSON.Point | GeoJSON.MultiPoint;
};
type LocationsQueryOptions = BaseQueryOptions & {
  bbox?: GeoJSON.Polygon;
  locationId?: string;
  limit?: number;
  offset?: number;
};
// type Coords = GeoJSON.LineString;
type Resolutions = {
  x: number;
  y: number;
  z: number;
};
