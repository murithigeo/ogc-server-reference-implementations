import type { ExegesisContext } from "exegesis";

async function getCollections(ctx: ExegesisContext) {}

async function putCollection(ctx: ExegesisContext) {
  const body = await ctx.requestBody();
  if (body.updateFrequency)
    throw ctx.makeValidationError(`updateFrequency member cannot be changed`, {
      in: "request",
      name: "updateFrequency",
      docPath: ctx.api.pathItemPtr,
    });
}

async function deleteCollection(ctx: ExegesisContext) {
    //const {}=
}

async function postCollection(ctx: ExegesisContext) {}

async function getCollection(ctx: ExegesisContext) {}
export default {
  deleteCollection,
  postCollection,
  putCollection,
  getCollections,
  getCollection,
};
