import type { ExegesisContext } from "exegesis";
import {
  FeaturesLinksManager,
  FeaturesRqManager,
} from "../../features/features.utils.ts";

export default {
  getConformance(ctx: ExegesisContext): void {
    const { f, output_formats } = new FeaturesRqManager({
      ctx,
    }).outputFormatParser("json", ["json"]);
    const { links } = new FeaturesLinksManager({ ctx, f, output_formats })
      .self()
      .alternates();
    const conformsTo = [];
    ctx.res.status(200).json({
      conformsTo,
      links,
    });
  },
};
