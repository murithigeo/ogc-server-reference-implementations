import type { ExegesisContext } from "exegesis-express";
import { getHtmlDocument } from "@scalar/core/libs/html-rendering";
import { stringify } from "yaml";
import { contenttypes, parseFormat } from "@template/utils";
export default {
  getServiceDoc: (ctx: ExegesisContext) => {
    ctx.res
      .set("content-type", "text/html")
      .setBody(getHtmlDocument({ url: `/features/api?f=json` }));
  },
  getServiceDesc: (ctx: ExegesisContext) => {
    const { format } = parseFormat(ctx, "JSON", ["JSON", "YAML", "HTML"]);
    switch (format) {
      case "YAML":
        ctx.res
          .status(200)
          .set("content-type", contenttypes.OPENAPI_YAML)
          .setBody(stringify(ctx.api.openApiDoc));
        break;
      case "HTML":
        ctx.res.redirect(302, "/features/api.html");
        break;
      default:
        ctx.res
          .status(200)
          .set("content-type", contenttypes.OPENAPI_JSON)
          .setBody(ctx.api.openApiDoc);
        break;
    }
  },
};
