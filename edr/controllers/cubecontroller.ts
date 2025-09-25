import type { ExegesisContext } from "exegesis-express";

async function getCubeAtCollection(ctx: ExegesisContext): Promise<void> {}
const getCubeAtInstance = async (ctx: ExegesisContext): Promise<void> => {};
export default {
  "all@cube@collection": getCubeAtCollection,
  "all@cube@instance": getCubeAtInstance,
};
