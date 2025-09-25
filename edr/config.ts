import type {
  CoverageCollection,
  I18N,
  ObservedProperty,
  Unit,
} from "coveragejson";
import type { Length } from "convert";
import mountains from "./datasets/mountains.ts";
import type { contenttypes } from "../utils/constants.ts";
// import process from "node:process";
import type { Bbox, crs, Datetime } from "@template/utils";
import type { EdrFeatureCollection, FeatureCollection } from "./types.d.ts";

// //@external https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation
export default {
  datasets: [mountains],
} as Config;

export type Dataset = {
  id: string;
  description: string;
  output_formats: Array<keyof typeof contenttypes>;
  title?: string;
  crs: Array<string>;
  storageCrs: keyof typeof crs;
  keywords: string[];
  parameters: Array<{
    id: string;
    unit: Unit;
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
  bbox: Bbox[];
  crs: string;
  z: number[] | null;
  datetime: string[] | null;
  vrs: string;
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
    handler: <T>(opts: RadiusQueryOptions) => Promise<T> | T;
  };
  corridor?: DataQueryProps & {
    handler: (opts: CorridorQueryOptions) => unknown;
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
    handler: <T>(opts: TrajectoryQueryOptions) => Promise<T> | T;
  };
  position?: DataQueryProps & {
    handler: <T>(opts: PositionQueryOptions) => Promise<T> | T;
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
  crs: keyof typeof crs | string;
  server: string;
  instanceId?: string;
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
  resolution?: Resolutions;
};
type CubeQueryOptions = BaseQueryOptions & {
  bbox: GeoJSON.Polygon;
};
type CorridorQueryOptions = BaseQueryOptions & {
  "corridor-width": number;
  "corridor-height": number;
  resolutions?: Resolutions;
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
