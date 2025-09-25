import mts from "./mountains.json" with {type:"json"}
// import stations from "./stations.json" with {type:"json"};
import type {FeatureCollection,Point} from "geojson"

//@ts-expect-error Conflicting type assertion due to json import
export const mountains: FeatureCollection<
  Point,
  {
    feet: number;
    meters: number;
    // latitude: number;
    // longitude: number;
    name: string;
    regions: Array<string>;
    countries: Array<string> | null;    
    continent: string|null;
    states: Array<string>|null;
  }
> = mts;

// export {default as projjson} from "./projjsons.json" with {type:"json"}