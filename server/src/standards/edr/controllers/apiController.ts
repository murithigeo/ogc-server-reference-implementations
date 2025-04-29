import type { ExegesisContext, ExegesisResponse } from "exegesis-express";
import { EdrRqManager } from "../edr.utils.ts";
import { scalar } from "../../../common/utils/scalar.ts";
import { jsonlikeToYAML } from "../../../common/common.utils.ts";
const getServiceDoc = async (ctx: ExegesisContext): Promise<void> => {
  ctx.res
    .status(200)
    .set("content-type", "text/html")
    .setBody(scalar(ctx.api.openApiDoc));
};

const getServiceDesc = async (ctx: ExegesisContext): Promise<void> => {
  let { f, contentTypeHeader } = new EdrRqManager({
    ctx,
    collections: [],
  }).outputFormatParser("json", ["json", "yaml"]);

  const { openApiDoc } = ctx.api;
  //Technically this is the same as text/yaml

  ctx.res.status(200);
  //.set(...contentTypeHeader)
  //  .setBody(doc);
  switch (f) {
    case "json":
      ctx.res
        .set("content-type", "application/vnd.oai.openapi+json;version=3.0")
        .setBody(openApiDoc);
      break;
    case "yaml":
      ctx.res
        .set("content-type", "application/vnd.oai.openapi;version=3.0")
        .setBody(jsonlikeToYAML(openApiDoc));
      break;
    case "html":
      ctx.res.redirect(302, ctx.api.serverObject?.url + "/api.html");
      break;
  }
  ctx.res.end();
};

export default { getServiceDesc, getServiceDoc };
