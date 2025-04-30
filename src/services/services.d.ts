export as namespace Services;
import type { CoverageJSON } from "@types/coveragejson";
import type { RefExpression } from "../models/db.js";
import type { Length } from "convert";
import type { EdrRqManager } from "../standards/edr/edr.utils.js";
import type { FeaturesRqManager } from "../standards/features/features.utils.js";
import type { contenttypes } from "../common/utils/contenttypes.js";
import type { oas3 } from "exegesis";

type SpatialOptions =
  /**
   * Remember that some query_types may not have bboxCrs thus may need to use crs;
   * Also remember that height values of the bbox may have height values which are encoded in the z object
   */
  (
    | {
        query_type: "items";
        bbox?: CommonTypes.Bbox;
        bboxCrs?: CommonTypes.CrsConfig;
      }
    | {
        query_type: "locations";
        bbox?: CommonTypes.Bbox;
      }
    | {
        query_type: "radius";
        coords: EdrRqManager["coords"];
        radius: EdrRqManager["radius"];
      }
    | {
        query_type: "corridor";
        coords: EdrRqManager["coords"];
        resolutions?: EdrRqManager["resolutions"];
        corridor: EdrRqManager["corridor"];
      }
    | {
        query_type: "cube";
        bbox: CommonTypes.Bbox;
        bboxCrs?: CommonTypes.CrsConfig;
      }
    | {
        query_type: "area";
        coords: EdrRqManager["coords"];
        resolutions?: EdrRqManager["resolutions"];
      }
    | {
        query_type: "trajectory";
        coords: EdrRqManager["coords"];
      }
    | {
        query_type: "instances";
        bbox?: CommonTypes.Bbox;
        datetime?: FeaturesRqManager["datetime"];
      }
    | { query_type: "position"; coords: Coords }
  ) & {
    datetime?: FeaturesRqManager["datetime"];
    z?: FeaturesRqManager["z"];
  };

type ParameterIds =
  | "temperature"
  | "dewPointTemperature"
  | "pressure"
  | "windDirection"
  | "windType"
  | "windSpeed";
export interface EdrCollection {
  id: string;
  crs: CommonTypes.CrsConfig["crs"][];
  storageCRS: string;
  keywords: string[];
  storageSRID: number;
  licenses?: {
    [x: string]: { lang: string; href: string; type: string };
  };
  description?: string;
  title: string;
  //Double check requirements
  toc?: {
    [x: string]: { lang: string; href: string; type: string };
  };
  parameters: {
    id: ParameterIds;
    unit: CoverageJSON.Unit;
    observedProperty: CoverageJSON.ObservedProperty;
    column: RefExpression;
    index?: number;
    dataType: CoverageJSON.NdArray["dataType"];
    targetAxis: string[];
    description?: CoverageJSON.I18N;
    label?: CoverageJSON.I18N;
    categoryEncoding?: CoverageJSON.Parameter["categoryEncoding"];
    measurementType?: EdrTypes.Parameter;
  }[];
  query: Query;

  data_queries: {
    locations?: DataQueryConfig & {
      handler: ({
        datetime,
        z,
        bbox,
        crs,
      }: {
        datetime?: Datetime;
        z?: Z;
        bbox?: Bbox;
        crs: CommonTypes.CrsConfig;
        instanceId?: string | number;
        limit: number;
        offset: number;
      }) => Promise<{
        data: CommonTypes.FeatureCollection;
        numberMatched: number;
      }>;
    };
    items?: DataQueryConfig;
    radius?: DataQueryConfig & { within_units: Length[] };
    trajectory?: DataQueryConfig;
    corridor?: DataQueryConfig & {
      width_units: Length[];
      height_units: Length[];
    };
    instances?: DataQueryConfig & {
      //values?: string[];
      default_instanceid: string;
    };
    position?: DataQueryConfig;
    area?: DataQueryConfig;
    cube?: DataQueryConfig;
  };
  extentQuery: ExtentQuery;
}

interface DataQueryConfig {
  output_formats: string[];
  //Add future support to disallow query_types at instance or collection level
  servedAt?: ("instances" | "collection")[];
  default_output_format: string;
  hreflang?: string;
  //crs: string[];
}

export type FeaturesCollection = Pick<
  EdrCollection,
  | "id"
  | "title"
  | "description"
  | "crs"
  | "storageCRS"
  | "toc"
  | "licenses"
  | "query"
  | "extentQuery"
  | "storageSRID"
>;

interface EdrApiOptions {
  conformsTo: string[];
  collections: EdrCollection[];
}

interface FeaturesApiOptions {
  collections: FeaturesCollection[];
  conformsTo: string[];
}

/*
  type DataQueryConfig = (
    | {
        query_type: "locations" | "items" | "area" | "position" | "trajectory";
      }
    | { query_type: "radius"; within_units: Length[] }
    | { query_type: "corridor"; height_units: Length[]; width_units: Length[] }
    | {
        query_type: "instances";
        values?: string[] | number[];
        default_instanceid: string | number;
      }
  ) & { output_formats: string[]; default_output_format: string };
  */

type Datetime = FeaturesRqManager["datetime"];
type Z = FeaturesRqManager["z"];
type Coords = EdrRqManager["coords"];
type Bbox = CommonTypes.Bbox;
type F = keyof typeof contenttypes;


type Query = (opt: {
  server: oas3.ServerObject;
  f: keyof typeof contenttypes;
  itemId?: string | number;
  locationId?: string | number;
  instanceId?: string;
  spatial?: SpatialOptions;
  offset: number;
  limit: number;
  parameters: EdrCollection["parameters"];
  crs: CommonTypes.CrsConfig;
}) => Promise<{
  data:
    | EdrTypes.EdrFeature
    | EdrTypes.EdrFeatureCollection
    | CoverageJSON.CoverageJSON
    | CommonTypes.Feature
    | CommonTypes.FeatureCollection;
  numberMatched: number;
}>;

//| undefined

type ExtentQuery = (opt: {
  crs: CommonTypes.CrsConfig;
  mode: "collection" | "instances";
  instanceId?: string | number;
}) => Promise<
  {
    id: string;
    tmin: string | null;
    tmax: string | null;
    tvalues: string[] | null;
    zmin: number | null;
    zmax: number | null;
    zvalues: number[] | null;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    //geom: GeoJSON.Polygon;
  }[]
>;
