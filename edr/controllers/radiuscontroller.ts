import type { ExegesisContext } from "exegesis-express";

async function getRadiusAtCollection(ctx: ExegesisContext): Promise<void> {}
async function getRadiusAtInstance(ctx: ExegesisContext): Promise<void> {}
export default {
  "all@radius@collection": getRadiusAtCollection,
  "all@radius@instance": getRadiusAtInstance,
};
