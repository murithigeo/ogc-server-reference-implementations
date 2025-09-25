import { getHtmlDocument } from "@scalar/core/libs/html-rendering";
import type { ExegesisContext } from "exegesis-express";
import { contenttypes, parseFormat } from "@template/utils";
import { stringify } from "yaml";
function getServiceDoc(ctx: ExegesisContext): void {
  ctx.res
    .status(200)
    .set("content-type", "text/html")
    .setBody(
      getHtmlDocument({ url: `${ctx.api.serverObject?.url}/api?f=json` })
    );
}

function getServiceDesc(ctx: ExegesisContext): void {
  const { f } = parseFormat(ctx, "JSON", ["JSON", "YAML", "HTML"]);

  let { openApiDoc } = ctx.api;
  openApiDoc = {
    ...openApiDoc,
    servers: [ctx.api.serverObject!, ...(openApiDoc.servers || [])],
  };
  ctx.res.status(200);
  switch (f) {
    case "YAML":
      ctx.res
        .set("content-type", contenttypes.OPENAPI_YAML)
        .setBody(stringify(openApiDoc));
      break;
    case "HTML":
      ctx.res.redirect(302, ctx.api.serverObject?.url + "/api.html");
      break;
    default:
      ctx.res
        .set("content-type", contenttypes.OPENAPI_JSON)
        .setBody(openApiDoc);
  }
}

export default { getServiceDesc, getServiceDoc };
