import type { ExegesisContext } from "exegesis-express";
import { getHtmlDocument } from "@scalar/core/libs/html-rendering";
import { stringify } from "yaml";
import { contenttypes } from "@template/utils";
export default {
  getServiceDoc: (ctx: ExegesisContext) => {
    ctx.res
      .set("content-type", "text/html")
      .setBody(getHtmlDocument({ url: `/features/api?f=json` }));
  },
  getServiceDesc: (ctx: ExegesisContext) => {
    const f = ctx.params.query.f.toUpperCase();
    switch (f) {
      case "YAML":
        ctx.res
          .status(200)
          .set("content-type", contenttypes.OPENAPI_YAML)
          .setBody(stringify(ctx.api.openApiDoc));
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
