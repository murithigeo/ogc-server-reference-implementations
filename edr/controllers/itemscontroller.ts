import type { ExegesisContext } from "exegesis-express";

async function getItemsAtCollection(ctx: ExegesisContext): Promise<void> {}

async function getItemAtCollection(ctx: ExegesisContext): Promise<void> {}
async function getItemsAtInstance(ctx: ExegesisContext): Promise<void> {}

async function getItemAtInstance(ctx: ExegesisContext): Promise<void> {}

export default {
  //[scope,query_type,instance|collection]
  "all@items@collection": getItemsAtCollection,
  "all@items@instance": getItemsAtInstance,
  "one@items@collection": getItemAtCollection,
  "one@items@instance": getItemAtInstance,
};
