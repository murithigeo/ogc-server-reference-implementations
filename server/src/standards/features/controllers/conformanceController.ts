import type { ExegesisContext, ExegesisResponse } from "exegesis-express";
import { LinkManager } from "../../../common/utils/linkManager.ts";
import { FeaturesLinksManager, FeaturesRqManager } from "../features.utils.ts";
import YAML from "js-yaml";
async function getConformance(ctx: ExegesisContext): Promise<void> {
  const { f, contentTypeHeader, output_formats } = new FeaturesRqManager({
    ctx,
  }).outputFormatParser("JSON", ["JSON", "YAML"]);

  const { links } = new FeaturesLinksManager({ ctx, f, output_formats })
    .self()
    .alternates();
  const doc: CommonTypes.ConformanceDocument = {
    conformsTo: [
      "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core",
      "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30",
      "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson",
      "http://www.opengis.net/spec/ogcapi-features-2/1.0/conf/crs",
    ],
    links,
  };

  ctx.res.status(200).set(...contentTypeHeader);
  switch (f) {
    case "json":
      ctx.res.setBody(doc);
      break;
    case "yaml":
      ctx.res.setBody(YAML.dump(doc));
      break;
  }
  ctx.res.end();
}
export default { getConformance };
