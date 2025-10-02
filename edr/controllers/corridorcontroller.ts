import type { ExegesisContext } from "exegesis-express";
import type { Dataset } from "../config.ts";
import { parseFormat } from "@template/utils";
import { Links } from "../links.ts";

async function getCorridorAtCollection(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const corridor = dataset.data_queries.corridor!;
  const { output_formats } = parseFormat(
    ctx,
    corridor.default_output_format,
    corridor.output_formats || dataset.output_formats
  );
  const { links } = new Links(ctx).self().alternates(output_formats);
  const doc = await corridor.handler({ ...ctx["ectx"] });

  ctx.res.status(200).setBody({ ...doc, links });
}
async function getCorridorAtInstance(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const corridor = dataset.data_queries.corridor!;
  const { output_formats } = parseFormat(
    ctx,
    corridor.default_output_format,
    corridor.output_formats || dataset.output_formats
  );
  const doc = await corridor.handler({
    ...ctx["ectx"],
  });
  const { links } = new Links(ctx).self().alternates(output_formats);

  ctx.res.status(200).setBody({ ...doc, links });
}
export default {
  "all@corridor@collection": getCorridorAtCollection,
  "all@corridor@instance": getCorridorAtInstance,
};
