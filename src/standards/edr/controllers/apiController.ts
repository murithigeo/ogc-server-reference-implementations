import type { ExegesisContext } from "exegesis-express";
import { EdrRqManager } from "../edr.utils.js";
import { scalar } from "../../../common/utils/scalar.js";
import { jsonlikeToYAML } from "../../../common/common.utils.js";
import { servers } from "../../../app.js";

function getServiceDoc(ctx: ExegesisContext): void {
  ctx.res
    .status(200)
    .set("content-type", "text/html")
    .setBody(scalar([{ url: `${ctx.api.serverObject?.url}/api?f=json` }]));
}

function getServiceDesc(ctx: ExegesisContext): void {
  const { f } = new EdrRqManager({
    ctx,
    collections: [],
  }).outputFormatParser("json", ["json", "yaml"]);
  let { openApiDoc } = ctx.api;
  openApiDoc = {
    ...openApiDoc,
    // This negates the need to set a env variable with the server url
    servers: [ctx.api.serverObject, ...openApiDoc.servers || [], ...servers.map(({ url, description }) => ({ url: `${url}/edr`, description }))]
  }
  ctx.res.status(200);
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
}

export default { getServiceDesc, getServiceDoc };
