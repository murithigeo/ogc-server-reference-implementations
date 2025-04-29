import type { ExegesisContext, ExegesisResponse } from "exegesis-express";
import { scalar } from "../../../common/utils/scalar.js";
import { FeaturesRqManager } from "../features.utils.js";
import yaml from "js-yaml";
const getServiceDesc = async (
  ctx: ExegesisContext
): Promise<ExegesisResponse> => {
  const { f, contentTypeHeader } = new FeaturesRqManager({
    ctx,
    collections: [],
  }).outputFormatParser("JSON", ["JSON", "YAML", "HTML"]);

  ctx.res.setStatus(200);
  ctx.res.setHeader(...contentTypeHeader);

  switch (f) {
    case "json":
      ctx.res
        .set("content-type", "application/vnd.oai.openapi+json;version=3.0")
        .setBody(ctx.api.openApiDoc);
      break;
    case "yaml":
      ctx.res
        .set("content-type", "application/vnd.oai.openapi;version=3.0")
        .setBody(yaml.dump(ctx.api.openApiDoc));
      break;
    case "html":
      ctx.res.redirect(302, "/features/api.html");
      break;
  }
  return ctx.res;
};

const getServiceDoc = async (
  ctx: ExegesisContext
): Promise<ExegesisResponse> => {
  return ctx.res
    .status(200)
    .set("content-type", "text/html")
    .setBody(scalar(ctx.api.openApiDoc));
};

export default { getServiceDoc, getServiceDesc };
