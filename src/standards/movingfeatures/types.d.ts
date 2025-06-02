import type { Geometry } from "geojson";
import type { FeaturesCollection } from "../../services/services.js";
export interface MvCollection extends FeaturesCollection{
  
}
export as namespace MovingFeaturesTypes;
export type Link = CommonTypes.Link;
export type LandingPage = CommonTypes.Root;
export type Exception = {
  code: number;
  description?: string;
};
export type ConfClasses = CommonTypes.ConformanceDocument;
export type Extent = CommonTypes.Extent;
export interface Collection extends CommonTypes.Collection {
  itemType: "movingfeature";
  updateFrequency: number;
}

/**if generic string,it should be URL parseable */
export type MotionCurve =
  | "Discrete"
  | "Linear"
  | "Quadratic"
  | "Cubic"
  | string;

export type NamedCRS = {
  type: "Name";
  properties: {
    name: string | "urn:ogc:def:crs:OGC:1.3:CRS84";
  };
} | null;

export type LinkedCRS = {
  type: "Link";
  properties: { type: string; href: string };
} | null;
export type CRS = LinkedCRS | NamedCRS;

export type TRS =
  | LinkedCRS
  | null
  | {
      type: "Name";
      properties: { name: "urn:ogc:data:time:iso8601" | string };
    };

export type TemporalPrimitiveGeometry = (
  | MovingPoint
  | MovingLineString
  | MovingPointCloud
  | MovingLineString
) & {
  datetimes: [string, ...string[]][];
  interpolation?: MotionCurve;
  base?: { href: string; type: string } | null;
  orientations?: {
    scales: [number, number] | [number, number, number];
    angles: [number, number] | [number, number, number];
  } | null;
  crs?: CRS;
  trs?:TRS;
};

interface TemporalComplexGeometry {
    type: "MovingGeometryCollection";
    prisms:Array<TemporalPrimitiveGeometry>;
    crs?:CRS;
    trs?:TRS;
}

type TemporalGeometry=TemporalComplexGeometry|TemporalPrimitiveGeometry;
interface ParametricValues {
    datetimes:[string,...string[]][];
    [x:string]:{
        type:"Measure";
        values: Array<number>|null;
        interpolation?:"Discrete"|"Step"|"Linear"|"Regression"|string;
        description?:string;
        form?:string
    }|{
        type:"Text";
        values: string[]|boolean[];
        interpolation?:"Discrete"|"Step"|"Linear"|"Regression"|string;
        description?:string;
    }|{
        type:"Image";
        values:Array<string>|null;
        interpolation?:"Discrete"|"Step"|"Linear"|"Regression"|string;
        description?:string;
    }
}
interface MovingPoint extends GeoJSON.Point {
  type: "MovingPoint";
}

interface MovingLineString extends GeoJSON.LineString {
  type: "MovingLineString";
}

interface MovingPolygon extends GeoJSON.Polygon {
  type: "MovingPolygon";
}
interface MovingPointCloud extends GeoJSON.MultiPoint {
  type: "MovingPointCloud";
}

type TemporalPropertiesMfJSON= Array<ParametricValues>|null;
type Bbox=CommonTypes.Bbox|null;

type LifeSpan =[string|null,string|null];

interface MovingFeature extends GeoJSON.Feature{
    id:string|number;
    temporalGeometry?: TemporalGeometry;
    temporalProperties?:TemporalPropertiesMfJSON;
    crs?:CRS;
    trs?:TRS;
    bbox?:Bbox;
    time?:LifeSpan;
    properties?:{
        [x:string]:any;
    }
}

interface MovingFeatures extends CommonTypes.FeatureCollection {
    features:null|Array<MovingFeature>;
    crs?:CRS;
    trs?:TRS;
    bbox?:Bbox;
    time?:LifeSpan;
}

interface MovingFeatureMfJSON extends GeoJSON.Feature {
    temporalGeometry: TemporalGeometry;
    temporalProperties?:TemporalPropertiesMfJSON;
    crs?:CRS;
    trs?:TRS;
    bbox?:Bbox;
    time?:LifeSpan;
    properties?:{[x:string]:any}|null
}

interface MovingFeatureCollection {
    type:"FeatureCollection";
    features:[MovingFeatureMfJSON,...MovingFeatureMfJSON][];
    crs?:CRS;
    trs?:TRS;
    bbox?:Bbox;
    time?:LifeSpan;
    label?: string|null
}

interface TemporalGeometrySequence {
    type:"TemporalGeometrySequence";
    geometrySequence:Array<TemporalPrimitiveGeometry>;
    links?:Link[];
    timeStamp?: string;
    numberMatched?:number;
    numberReturned?:number
}

interface TemporalPrimitiveValue{
    datetimes: [string,string,...string[]][];
    values: string|boolean|number;
    interpolation:"Discrete"|"Step"|"Linear"|"Regression";
}

interface TemporalProperty {
    name:string;
    type: "TBoolean"|"TText"|"TInteger"|"TReal"|"TImage";
    form?:string;
    valueSequence:Array<TemporalPrimitiveValue>;
    description?:string;
    links?:Link[]
};

interface TemporalProperties {
    temporalProperties:Array<TemporalProperty>|TemporalPropertiesMfJSON;
    links?:Link[];
    timeStamp?: string;
    numberMatched?:number;
    numberReturned?:number
}