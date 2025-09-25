import type { ExegesisContext } from "exegesis-express";

async function getPositionAtCollection(ctx: ExegesisContext): Promise<void> {}
async function getPositionAtInstance(ctx: ExegesisContext): Promise<void> {}
export default {
  "all@position@instance": getPositionAtInstance,
  "all@position@collection": getPositionAtCollection,
};
