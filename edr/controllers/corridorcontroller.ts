import type { ExegesisContext } from "exegesis-express";
import type { Dataset } from "../config.ts";
import { parseFormat } from "@template/utils";

function getCorridorAtCollection(ctx: ExegesisContext){
  const dataset: Dataset = ctx["ectx"].dataset;
  const corridor = dataset.data_queries.corridor!;
  const { contenttypeHeader } = parseFormat(
    ctx,
    corridor.default_output_format,
    corridor.output_formats
  );
  const doc = corridor.handler({ ...ctx["ectx"] });

  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody(doc);
}
function getCorridorAtInstance(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const corridor = dataset.data_queries.corridor!;
  const { contenttypeHeader } = parseFormat(
    ctx,
    corridor.default_output_format,
    corridor.output_formats
  );
  const doc = corridor.handler({
    ...ctx["ectx"],
    instanceId: ctx.params.path.instanceId,
  });

  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody(doc);
}
export default {
  "all@corridor@collection": getCorridorAtCollection,
  "all@corridor@instance": getCorridorAtInstance,
};
