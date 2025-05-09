import type { ExegesisContext } from "exegesis-express";
import { scalar } from "../../../common/utils/scalar.js";
import { FeaturesRqManager } from "../features.utils.js";
import { jsonlikeToYAML } from "../../../common/common.utils.js";

function getServiceDesc(ctx: ExegesisContext): void {
  const { f, contentTypeHeader } = new FeaturesRqManager({
    ctx,
    collections: [],
  }).outputFormatParser("JSON", ["JSON", "YAML", "HTML"]);

  ctx.res.status(200).set(...contentTypeHeader);

  switch (f) {
    case "json":
      ctx.res
        .set("content-type", "application/vnd.oai.openapi+json;version=3.0")
        .setBody(ctx.api.openApiDoc);
      break;
    case "yaml":
      ctx.res
        .set("content-type", "application/vnd.oai.openapi;version=3.0")
        .setBody(jsonlikeToYAML(ctx.api.openApiDoc));
      break;
    case "html":
      ctx.res.redirect(302, "/features/api.html");
      break;
  }
}

function getServiceDoc(ctx: ExegesisContext): void {
  ctx.res
    .status(200)
    .set("content-type", "text/html")
    .setBody(scalar([{ url: `/features/api?f=json` }]));
}

export default { getServiceDoc, getServiceDesc };
