import type { ExegesisContext } from "exegesis-express";
import type { Dataset } from "../config.ts";

export default {
  getItemsPage: async (ctx: ExegesisContext) => {
    const dataset: Dataset = ctx["ectx"].dataset;

    const res = await dataset.handler({
      ...ctx["ectx"],
    });
    ctx.res.status(200).setBody(res);
  },
  getItemPage: async (ctx: ExegesisContext) => {
    const dataset: Dataset = ctx["ectx"].dataset;

    const res = await dataset.handler({
      ...ctx["ectx"],
      featureId: ctx.params.path.featureId,
    });
    const feature = res.features[0];
    if (!feature) {
      throw ctx.makeError(404, "no such feature");
    }
    ctx.res.status(200).setBody(feature);
  },
};
