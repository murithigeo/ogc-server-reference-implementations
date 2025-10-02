import { bbox } from "@turf/bbox";
import { mountains } from "@template/data";
import {
  CRS84,
  numberReturned,
  type FeatureCollection,
  type Link,
  type Bbox,
  type Interval,
  type crs,
  reproject,
  intersects,
} from "@template/utils";

export type Dataset = {
  crs: Array<keyof typeof crs>;
  id: string;
  storageCrs: string;
  title?: string;
  attribution?: Array<Link>;
  description?: string;
  extent: () => { bbox: Bbox[]; interval: Interval[]; crs: string };
  handler: ({
    ...props
  }: {
    bbox?: GeoJSON.Polygon;
    datetime?: { min?: string; max?: string; values?: string[] };
    z?: { min?: number; max?: number; values?: number };
    limit: number;
    offset: number;
    crs: string;
    featureId?: string | number;
  }) => Promise<FeatureCollection> | FeatureCollection;
};
type Config = {
  datasets: Array<Dataset>;
};

export default {
  datasets: [
    {
      id: "world-mountains",
      description: "Mountains of the world and their metadata",
      crs: [
        "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
        "http://www.opengis.net/def/crs/EPSG/0/4326",
      ],
      storageCrs: CRS84,
      extent: () => {
        return {
          bbox: [bbox(mountains)],
          interval: [[null, null]],
          crs: CRS84,
        };
      },
      handler: ({ ...props }) => {
        const matched = mountains.features
          .filter((feat) => {
            if (!props.featureId) return true;
            return feat.properties.name === props.featureId.toString();
          })
          .sort((a, b) => a.properties.name.localeCompare(b.properties.name))
          .filter(intersects(props.bbox));

        return {
          type: "FeatureCollection",
          timeStamp: new Date().toJSON(),
          numberMatched: matched.length,
          numberReturned: numberReturned(
            matched.length,
            props.limit,
            props.offset
          ),
          features: matched
            .slice(props.offset, props.offset + props.limit)
            .map(
              reproject(
                "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
                props.crs
              )
            ),
        };
      },
      attribution: [
        {
          rel: "author",
          href: "jason@waldrip.net",
          title: "Email Jason Waldrip",
        },
        {
          rel: "original",
          href: "https://github.com/open-peaks/data",
          type: "text/html",
          title: "View Original",
        },
      ],
    },
  ],
} as Config;
