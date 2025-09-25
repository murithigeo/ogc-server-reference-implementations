import type { ExegesisContext } from "exegesis-express";
import type { ConformancePage } from "../types.d.ts";
import { parseFormat, Links } from "@template/utils";
function getConformance(ctx: ExegesisContext): void {
  const {  contenttypeHeader, output_formats } = parseFormat(ctx, "JSON", [
    "JSON",
  ]);
  const conformanceDoc: ConformancePage = {
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
    links: new Links(ctx).self().alternates(output_formats).links,
  };
  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody(conformanceDoc);
}

export default { getConformance };
