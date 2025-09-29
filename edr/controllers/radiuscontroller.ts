import type { ExegesisContext } from "exegesis-express";
import type { Dataset } from "../config.ts";
import { parseFormat } from "@template/utils";

function getRadiusAtCollection(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const radius = dataset.data_queries.radius!;
  const { contenttypeHeader } = parseFormat(
    ctx,
    radius.default_output_format,
    radius.output_formats
  );
  const res = radius.handler({ ...ctx["ectx"] });

  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody(res);
}
 function getRadiusAtInstance(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const radius = dataset.data_queries.radius!;
  const { contenttypeHeader } = parseFormat(
    ctx,
    radius.default_output_format,
    radius.output_formats
  );
  const res = radius.handler({ ...ctx["ectx"] });

  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody(res);
}
export default {
  "all@radius@collection": getRadiusAtCollection,
  "all@radius@instance": getRadiusAtInstance,
};
