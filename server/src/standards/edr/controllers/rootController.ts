import type { ExegesisContext } from "exegesis-express";
import { EdrLinksManager, EdrRqManager } from "../edr.utils.ts";
import { jsonlikeToYAML } from "../../../common/common.utils.ts";

function getRoot(ctx: ExegesisContext): void {
  const { f, output_formats, contentTypeHeader } = new EdrRqManager({
    ctx,
  }).outputFormatParser("json", ["json", "yaml"]);
  const { links } = new EdrLinksManager({ ctx, output_formats, f })
    .self()
    .alternates()
    .conformance()
    .serviceDesc()
    .serviceDoc()
    .collections();
  const rootDoc: EdrTypes.RootDocument = {
    title: "OGC-API EDR",
    description:
      "Reference API implementation for OGC-API Environmental Data Retrieval (EDR)",
    contact: {
      phone: "07-xxx-xxx-xx",
      email: "murithiedwing@gmail.com",
      city: "Nairobi",
      country: "Kenya",
      hours: "0800-1600H",
      stateorprovince: "Nairobi County",
      instructions: "None",
    },
    provider: {
      name: "None",
      url: "https://murithigeo.space",
    },
    links,
  };
  ctx.res.status(200).set(...contentTypeHeader);
  switch (f) {
    case "json":
      ctx.res.setBody(rootDoc);
      break;
    case "yaml":
      ctx.res.setBody(jsonlikeToYAML(rootDoc));
      break;
  }
}

export default { getRoot };
