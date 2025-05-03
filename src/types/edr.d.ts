import * as CommonTypes from "./commontypes.d.js";
import {CoverageJSON} from "coveragejson";

export as namespace EdrTypes;
export interface RootDocument extends CommonTypes.Root {
  provider?: { name: string; url: string };
  contact?: {
    phone?: string;
    email?: `${string}@${string}`;
    fax?: string;
    instructions?: string;
    hours?: string;
    address?: string;
    city?: string;
    stateorprovince?: string;
    country?: string;
  };
  links: CommonTypes.Link[];
}
export interface EdrFeature extends CommonTypes.Feature {
  /**
   * Properties to describe existing EDR features -- may be real-world or virtual sampling features.
   */
  properties: {
    [key: string]: any;
    /**
     * @description A URI identifying the query end point. May identify a specific location.
     * @example https://example.org/api/collections/collection/locations/location_123d
     */
    edrqueryendpoint: string;
    /**
     * @description Either a date-time or a period string that adheres to RFC 3339. Indicates the time instant or period for which data are available from the EDR feature.
     * @example 2018-02-12T00:00:00Z/2018-03-18T12:31:12Z
     */
    datetime: string;
    /**
     *@description A label such as a site name or other text to use on a link.
     * @example Site A
     * @throws error in covjson-validator if not I18N
     */
    label: string | CoverageJSON.I18N;
    /**
     * @description Unique IDs of available parameters, this is the value used for querying the data and corresponds to an ID in the parameter metadata of the collection.
     * @example ["velocity","temperature"]
     */
    "parameter-name": string[];
  };
  links?: CommonTypes.Link[];
}

export interface EdrFeatureCollection extends CommonTypes.FeatureCollection {
  /**List of data parameters available in the collection */
  parameters?: CoverageJSON.Parameter[];
  /** */
  features: EdrFeature[];
  links?: CommonTypes.Link[];
}

export interface Collection<DQ extends DataQueries = DataQueries>
  extends CommonTypes.Collection {
  /**
   * @description List of keywords which help to describe the collection
   */
  keywords?: string[];
  /**
   * @description The extent of the information in the collection. In the Core only spatial and temporal   extents are specified. Extensions may add additional members to represent other extents, for example, thermal or pressure ranges.
   */
  extent: CommonTypes.Extent & {
    spatial: {
      /**Default should be CRS84? */
      crs:
        | string
        | `GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]`;
      /**
       * @description name of the crs
       */
      name?: string;
    } & CommonTypes.Extent["spatial"];
    temporal: {
      /**
       * @description RFC3339 compliant Date and Time
       * Begin and end times of the time interval. The timestamps are in the temporal coordinate reference system specified in `trs`. By default this is the Gregorian calendar.
       * @example ["2020-11-12T12:15Z","2020-11-12T12:15Z"]
       */

      /**
       * @description  Provides information about the time intervals available in the collection as ISO8601 compliant dates, either as a time range specified
       * as start time / end time  (e.g. 2017-11-14T09:00Z/2017-11-14T21:00Z)  or as number of repetitions / start time / interval (e.g. R4/2017-11-14T21:00Z/PT3H)  or a list of time values (e.g.
       * 2017-11-14T09:00Z,2017-11-14T12:00Z,2017-11-14T15:00Z,2017-11-14T18:00Z,2017-11-14T21:00Z)
       * @example ["R12/2022-01-14T09:00Z/PT1H"]
       * @example ["2020-11-12T12:15Z"]
       */
      values?: string[];
      /**
       * @description Coordinate reference system of the coordinates in the temporal extent (property `interval`). The default reference system is the Gregorian calendar.
       * In the Core this is the only supported temporal coordinate reference system. Extensions may support additional temporal coordinate reference systems
       * @example TIMECRS["DateTime",TDATUM["Gregorian Calendar"],CS[TemporalDateTime,1],AXIS["Time (T)",future]]
       * @default http://www.opengis.net/def/uom/ISO-8601/0/Gregorian
       */
      trs: string | "http://www.opengis.net/def/uom/ISO-8601/0/Gregorian";
    };
    /**
     * @description The vertical extent of the information in the collection.
     */
    vertical?: {
      /**
       * @description In the Core only a single time interval is supported. Extensions may support multiple intervals. If multiple intervals are provided, the union of the intervals describes the vertical extent.
       * minimum and maximum heights of the vertical interval.
       * The values are in the vertical coordinate reference system specified in `vrs`.
       * By default this is the vertical coordinate reference system of the source information.
       * @example [["2","100"]]
       */
      interval: [string | null, string | null][];
      /**
       * @description  Vertical level intervals that data in the collection is available at these can be defined as follows:
       * min level / max level (e.g. "2/100") or
       * as number of repetitions / start level / interval (e.g."R5/100/50")
       *or a list of vertical levels (e.g. "2",10,"80","100"}
       * The value `null` is supported and indicates an open vertical interval.
       * @example ["2","10","80", "100"] or ["R20/1000/-50"]
       */
      values?: (string | null)[];
      /**
       * @description Coordinate reference system of the coordinates in the vertical extent (property `interval`).
       * @default VERTCS["WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PARAMETER["Vertical_Shift",0.0],PARAMETER["Direction",1.0],UNIT["Meter",1.0]],AXIS["Up",UP]
       * @example
       */
      vrs:
        | string
        | 'VERTCS["WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PARAMETER["Vertical_Shift",0.0],PARAMETER["Direction",1.0],UNIT["Meter",1.0]],AXIS["Up",UP]';
      /**
       * @description  Name of the vertical coordinate reference system
       */
      name?: string;
    };
  };
  /**list of the coordinate reference systems the collection results can support */
  crs: string[];
  /**list of formats the results can be presented in @example ["CoverageJSON","GRIB"] */
  output_formats: string[];
  /**list of the data parameters available in the collection */
  parameter_names: { [key: string]: Parameter };
  /** */
  data_queries: DQ;
}

/**
 * C.16 Measurement Type object
 * @description Provides basic information about how the parameter is calculated and over what time period
 */

export interface MeasurementTypeObject {
  /**Required
   * @example Mean,Max,Sum
   */
  method: string;
  /**
   * Duration of calculation. For time durations, this follows the ISO 8601 Duration standard.
   * A negative sign before a duration value (i.e. -PT10M) infers that the time start
   * starts at the specified duration before the time value assigned to the parameter value.
   * So if the measurement had a time value of 2020-04-05T14:30Z and a measurementType duration of -PT10M
   * the value is representative of the period 2020-04-05T14:20Z/2020-04-05T14:30Z;
   * if the measurement had a time value of 2020-04-05T14:30Z and a measurementType duration of PT10M
   * the value is representative of the period 2020-04-05T14:30Z/2020-04-05T14:40Z
   * @warning this member is required per the docs but is not present in the examples. Period appears instead
   */
  duration?: string;
  /**
   * @description Descriptor for length of measurement. Explicit definition not provided but is used extensively in the guideline
   */
  period?: string;
}

interface EdrParameter extends CoverageJSON.Parameter {}
export interface BaseDQVariables {
  query_type: LinkObject["link"]["variables"]["query_type"];
  title: string;
  description?: string;
  output_formats: string[];
  default_output_format: string;
  crs_details?: CrsObject[];
}
export interface LinkObject<
  T =
    | AreaDataQuery
    | PositionDataQuery
    | CorridorDataQuery
    | CubeDataQuery
    | InstancesDataQuery
    | ItemsDataQuery
    | LocationsDataQuery
    | RadiusDataQuery
    | TrajectoryDataQuery
> {
  link: CommonTypes.Link & { variables: T };
}
export interface DataQueries {
  position?: LinkObject<PositionDataQuery>;
  area?: LinkObject<AreaDataQuery>;
  corridor?: LinkObject<CorridorDataQuery>;
  cube?: LinkObject<CubeDataQuery>;
  instances?: LinkObject<InstancesDataQuery>;
  items?: LinkObject<ItemsDataQuery>;
  locations?: LinkObject<LocationsDataQuery>;
  radius?: LinkObject<RadiusDataQuery>;
  trajectory?: LinkObject<TrajectoryDataQuery>;
}
//const x:DataQueries={"position":{"link":{"variables":{""}}}}

interface CrsObject {
  /**
   * @description name of the coordinate reference system, used as the value in the crs query parameter to define the required output CRS
   * @example native
   */
  crs: string;
  /**
   * @description Well Known text description of the coordinate reference system
   * @example 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]'
   */
  wkt: string;
}

export interface AreaDataQuery extends BaseDQVariables {
  query_type: "area";
}
export interface CorridorDataQuery extends BaseDQVariables {
  query_type: "corridor";
  /**list of width distance units distance values can be specified in */
  width_units: string[];
  /**list of height distance units distance values can be specified in */
  height_units: string[];
}
export interface CubeDataQuery extends BaseDQVariables {
  query_type: "cube";
  /** list of z distance units vertical values can be specified in*/
  height_units: string[];
}

export interface InstancesDataQuery extends BaseDQVariables {
  query_type: "instances";
}
export interface ItemsDataQuery extends BaseDQVariables {
  query_type: "items";
}
export interface LocationsDataQuery extends BaseDQVariables {
  query_type: "locations";
}
export interface PositionDataQuery extends BaseDQVariables {
  query_type: "position";
}

export interface RadiusDataQuery extends BaseDQVariables {
  query_type: "radius";
  /**list of distance units radius values can be specified in @example ["km","miles"]*/
  within_units: string[];
}
export interface TrajectoryDataQuery extends BaseDQVariables {
  query_type: "trajectory";
}

/**
 * @example {id: "http://vocab.nerc.ac.uk/standard_name/sea_ice_area_fraction/",label: "Sea Ice Concentration"}
 */
interface ObservedPropertyCollection {
  /** URI linking to an external registry which contains the definitive definition of the observed property */
  id?: string;
  /**No specific type but assume its i18n */
  label: CoverageJSON.I18N;
  description?: string;
  /**minItems:1 */
  categories?: {
    /** URI linking to an external registry which contains the definitive definition of the observed property */
    id: string;
    label: string | (CoverageJSON.I18N & { en: string });
  }[];
}

export interface Parameter extends CoverageJSON.Parameter {
  measurementType?: MeasurementTypeObject;
  /* {
		 Approach to calculating the data values i.e. mean, average
		method: string;

		//Measurement time duration
		 //The time duration that the value was calculated for as an RFC3339 duration value.  If the method value is instantaneous this value is not required.
		 //PT10M
		 
		duration?: string;
	};
	*/
  extent?: Collection["extent"];
}

export interface Collections {
  collections: Array<Collection<DataQueries>>;
  links: Array<CommonTypes.Link>;
}

export interface Instances {
  instances: Array<Collection<Omit<DataQueries, "instances">>>;
  links: Array<CommonTypes.Link>;
}
interface Exception {
  code: string;
  description?: string;
}

/**
 * @description requestBody for area
 * @method PUT/POST
 */
interface AreaRequestBody extends RequestBodyObject {
  /**Well Known Text Polygon definition */
  coords: string;
  /** */
  z?: string;

  /**@description */
  "resolution-x": string;
  /**
   * @description
   */
  "resolution-y": string;
}

interface CorridorRequestBody extends AreaRequestBody {
  /**The split schemas conflict with the main schema*/
  "corridor-width": string;
  /**Conflict */
  "corridor-height": string;
  /**@description the unit of the corridor-width parameter */
  "width-units": string;
  /**
   * @description The Unit of the corridor-height parameter
   */
  "height-units": string;
}

interface CubeRequestBody
  extends Omit<AreaRequestBody, "resolution-x" | "resolution-y" | "coords"> {
  /**See @interface CommonTypes.Collection */
  bbox: CommonTypes.Bbox;
}

interface RequestBodyObject {
  /** */
  datetime?: string;
  /**
   * @description A text-delimited array of parameters that should be included in response
   */
  "parameter-name"?: string[];
  /**the CRS that the response should be in */
  crs?: string | CommonTypes.CrsConfig["crs"];
  /**
   * @description the content-type negotiator
   * On OGCAPI, json can also be used in geojson endpoints such as items or itemId
   */
  f?: string;
}

type LocationRequestBody = RequestBodyObject;

interface LocationsRequestBody
  extends Omit<RequestBodyObject, "f" | "crs" | "parameter-name"> {
  /** Dunno why schemas are saying string */
  bbox: CommonTypes.Bbox;
}

type PositionRequestBody = Omit<
  AreaRequestBody,
  "resolution-x" | "resolution-y"
>;

interface RadiusRequestBody
  extends Omit<AreaRequestBody, "resolution-x" | "resolution-y"> {
  /**Radius of circle */
  within: number;
  /**units of within parameter */
  "within-units": string;
}
type TrajectoryRequestBody = AreaRequestBody;
