import { isdCollection } from "./isd.service.ts";
import {
  mountainsCollection,
  mountainsEdrCollection,
} from "./mountains.service.ts";
import type { EdrCollection, FeaturesCollection } from "./services.d.ts";

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
