import type { ExegesisContext } from "exegesis-express";
import { FeaturesLinksManager, FeaturesRqManager } from "../features.utils.ts";
import { jsonlikeToYAML } from "../../../common/common.utils.ts";

async function getRoot(ctx: ExegesisContext): Promise<void> {
  const { f, output_formats, contentTypeHeader } = new FeaturesRqManager({
    ctx,
  }).outputFormatParser("json", ["json", "yaml","html"]);
  const { links } = new FeaturesLinksManager({
    ctx,
    f,
    output_formats,
  })
    .self()
    .alternates()
    .override_output_formats(["json","yaml"])
    .conformance()
    .override_output_formats(["json","yaml"])
    .collections()
    .override_output_formats(["json", "yaml", "html"])
    .serviceDesc()
    .serviceDoc();

  const doc: CommonTypes.Root = {
    description:
      "Demo API for OGC Features API.\n Supports Part 1 and Part 2 Conformance Requirements",
    title: "OGC API Features Demo API",
    links,
  };

  ctx.res.set(...contentTypeHeader);
  switch (f) {
    case "json":
      ctx.res.setBody(doc);
      break;
    case "yaml":
      ctx.res.setBody(jsonlikeToYAML(doc));
      break;
    case "html":
      ctx.res.setBody(Root({ doc }));
      break;
    default:
      throw ctx.makeError(503, "content-type not implemented yet.");
  }
}

export default { getRoot };
