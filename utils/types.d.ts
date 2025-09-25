export type Link = {
  href: string;
  rel: string;
  title: string;
  hreflang?: string;
  length?: string;
  templated?: boolean;
  type?: string;
};

export type LandingPage = {
  links: Array<Link>;
  title?: string;
  description?: string;
};

export interface Collection extends LandingPage {
  id: string;
  storageCrsCoordinateEpoch?: number;
  crs: Array<string>;
  storageCrs?: string;
  itemType?: string | "feature";
  extent: Extent;
}

export type Bbox =
  | [number, number, number, number]
  | [number, number, number, number, number, number];

export type Interval = [string | null, null | string];
export interface Extent {
  spatial: {
    bbox: Array<Bbox>;
    crs: string;
  };
  temporal: {
    interval: Array<Interval>;
    trs: string;
  };
}

export interface Feature<
  G extends GeoJSON.Geometry,
  P extends { [x: string]: unknown }
> extends GeoJSON.Feature<G, P> {
  id?: string | number;
  links?: Array<Link>;
}

export interface ConformancePage {
  links?: Array<Link>;
  conformsTo: Array<string>;
}

type Crs = {
  type: string;
  hasZ: boolean;
  srid: number;
  flipCoords: boolean;
};
export interface FeatureCollection<
  G extends GeoJSON.Geometry = GeoJSON.Geometry,
  P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties
> extends GeoJSON.FeatureCollection<G, P> {
  numberMatched: number;
  numberReturned: number;
  timeStamp: string;
}

export type Datetime = {
  min?: string;
  max?: string;
  values?: string[];
};

export type Elevation = {
  min?: number;
  max?: number;
  values?: number[];
};

