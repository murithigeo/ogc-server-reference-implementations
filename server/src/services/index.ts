import { isdCollection } from "./isd.service.js";
import {
  mountainsCollection,
  mountainsEdrCollection,
} from "./mountains.service.js";
import type { EdrCollection, FeaturesCollection } from "./services.d.js";

export const services: {
  edr: EdrCollection[];
  features: FeaturesCollection[];
} = {
  edr: [
    //mountainsEdrCollection,
    isdCollection,
  ],
  features: [mountainsCollection],
};

/*
export const {
  JSON:"json"
}
  */
