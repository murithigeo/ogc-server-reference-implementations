import type { ExegesisContext } from "exegesis-express";

async function getTrajectoryAtCollection(ctx: ExegesisContext): Promise<void> {}

async function getTrajectoryAtInstance(ctx: ExegesisContext): Promise<void> {}

export default {
  "all@trajectory@collection": getTrajectoryAtCollection,
  "all@trajectory@instance": getTrajectoryAtInstance,
};
