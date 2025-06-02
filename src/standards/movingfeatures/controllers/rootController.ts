import type { ExegesisContext } from "exegesis";
import {
  FeaturesLinksManager,
  FeaturesRqManager,
} from "../../features/features.utils.ts";

export default {
  getLandingPage(ctx: ExegesisContext): void {
    const { f, output_formats } = new FeaturesRqManager({
      ctx,
    }).outputFormatParser("json", ["json", "yaml"]);
    const { links } = new FeaturesLinksManager({ ctx, f, output_formats })
      .self()
      .alternates()
      .conformance()
      .serviceDesc()
      .serviceDoc()
      .collections();

    const rootDoc: EdrTypes.RootDocument = {
      title: `Reference implementation for OGCAPI-Moving Features Standard`,
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
    ctx.res.status(200).json(rootDoc);
  },
};
