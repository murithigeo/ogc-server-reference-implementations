import type { ExegesisContext } from "exegesis";
import { FeaturesRqManager } from "../features.utils.ts";
// /collections/{collectionId}/queryables
// TODO Add support for querables + schemas
/*
export default {
  getQueryables(ctx: ExegesisContext): void {
    const { collection, url } = new FeaturesRqManager({
      ctx,
    }).collectionParser();

    ctx.res
      .status(200)
      .set("content-type", "application/schema+json")
      .setBody({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: url.toString(),
        type: "object",
        tile: collection?.title,
        description: collection?.description,
        properties: collection.queryables.properties,
        additionalProperties:
          collection.queryables.additionalProperties || false,
      });
  },
};

*/