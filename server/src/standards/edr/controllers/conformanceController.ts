import type { ExegesisContext } from "exegesis-express";
import { FeaturesRqManager } from "../../features/features.utils.ts";
import { jsonlikeToYAML } from "../../../common/common.utils.ts";
import { EdrLinksManager } from "../edr.utils.ts";

function getConformance(ctx: ExegesisContext): void {
  const { contentTypeHeader, f, output_formats } = new FeaturesRqManager({
    ctx,
    collections: [],
  }).outputFormatParser("JSON", ["JSON", "YAML"]);

  const conformanceDoc: CommonTypes.ConformanceDocument = {
    conformsTo: [
      "http://www.opengis.net/spec/ogcapi-edr-1/1.1/conf/collections",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.1/conf/core",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.0/conf/core",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.1/conf/oas30",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.1/conf/geojson",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.1/conf/json",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.1/conf/edr-geojson",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.1/conf/covjson",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.1/conf/queries",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.0/conf/edr-geojson",
      "http://www.opengis.net/spec/ogcapi-edr-1/1.0/conf/geojson",
    ],
    links: new EdrLinksManager({ ctx, f, output_formats }).self().alternates()
      .links,
  };

  ctx.res.status(200).set(...contentTypeHeader);
  switch (f) {
    case "json":
      ctx.res.setBody(conformanceDoc);
      break;
    case "yaml":
      ctx.res.setBody(jsonlikeToYAML(conformanceDoc));
      break;
  }
  ctx.res.end();
}

export default { getConformance };
