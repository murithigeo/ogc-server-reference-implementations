import type { ExegesisContext } from "exegesis-express";
import type { Dataset } from "../config.ts";
import { parseFormat } from "@template/utils";
import { Links } from "../links.ts";

function getTrajectoryAtCollection(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const trajectory = dataset.data_queries.trajectory!;
  const { output_formats, contenttypeHeader } = parseFormat(
    ctx,
    trajectory?.default_output_format,
    trajectory.output_formats
  );
  const res = trajectory.handler({ ...ctx["ectx"] });
  const { links } = new Links(ctx).self().alternates(output_formats);
  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody({ ...res, links });
}

function getTrajectoryAtInstance(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const trajectory = dataset.data_queries.trajectory!;
  const { output_formats, contenttypeHeader } = parseFormat(
    ctx,
    trajectory?.default_output_format,
    trajectory.output_formats
  );
  const res = trajectory.handler({ ...ctx["ectx"] });
  const { links } = new Links(ctx).self().alternates(output_formats);
  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody({ ...res, links });
}

export default {
  "all@trajectory@collection": getTrajectoryAtCollection,
  "all@trajectory@instance": getTrajectoryAtInstance,
};
