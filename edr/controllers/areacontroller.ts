import type { ExegesisContext } from "exegesis-express";

async function getAreaAtCollection(ctx: ExegesisContext): Promise<void> {}
async function getAreaAtInstance(ctx: ExegesisContext): Promise<void> {}
export default {
  "all@area@collection": getAreaAtCollection,
  "all@area@instance": getAreaAtInstance,
};
