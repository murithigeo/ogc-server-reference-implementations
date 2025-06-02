import type { ExegesisContext } from "exegesis";
import { scalar } from "../../../common/utils/scalar.ts";
import { FeaturesRqManager } from "../../features/features.utils.ts";
import { jsonlikeToYAML } from "../../../common/common.utils.ts";

export default {
  getServiceDoc(ctx: ExegesisContext): void {
    ctx.res
      .status(200)
      .set("content-type", "text/yaml")
      .setBody(scalar([{ url: `${ctx.api.serverObject?.url}/api?f=json` }]));
  },
  getServiceDesc(ctx: ExegesisContext): void {
    const { f } = new FeaturesRqManager({ ctx }).outputFormatParser("json", [
      "json",
      "yaml",
    ]);
    ctx.res.status(200);
    switch (f) {
      case "yaml":
        ctx.res
          .set("content-type", "application/vnd.oai.openapi;version=3.0")
          .setBody(jsonlikeToYAML(ctx.api.openApiDoc));
        break;
      case "json":
        ctx.res
          .set("content-type", "application/vnd.oai.openapi+json;version=3.0")
          .setBody(ctx.api.openApiDoc);
        break;
      case "html":
        ctx.res.redirect(302, `${ctx.api.serverObject?.url}/api.html`);
        break;
    }
  },
};
