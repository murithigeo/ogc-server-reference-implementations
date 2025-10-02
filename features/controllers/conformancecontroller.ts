import type { ExegesisContext } from "exegesis";
import { parseFormat, type ConformancePage, Links } from "@template/utils";
export default {
  getConformancePage: (ctx: ExegesisContext) => {
    const { format, output_formats } = parseFormat(ctx, "JSON", [
      "JSON",
      "HTML",
    ]);
    const doc: ConformancePage = {
      conformsTo: [
        "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core",
        "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30",
        "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson",
        "http://www.opengis.net/spec/ogcapi-features-2/1.0/conf/crs",
      ],
      links: new Links(ctx).self().alternates(output_formats).links,
    };
    let data;
    switch (format) {
      case "HTML":

      default:
        data = doc;
    }
    ctx.res.status(200).setBody(data);
  },
};
