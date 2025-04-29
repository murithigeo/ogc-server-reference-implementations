import type { ExegesisContext, ExegesisResponse } from "exegesis-express";
import {
  featuresCollectionDocGenerator,
  FeaturesRqManager,
} from "../features.utils.js";
import {
  filterCollectionByBbox,
  filterCollectionByDatetime,
  jsonlikeToYAML,
} from "../../../common/common.utils.js";
import { FeaturesLinksManager } from "../features.utils.js";
import { CRS84 } from "../../../common/utils/CrsManager.js";
async function getCollection(ctx: ExegesisContext): Promise<void> {
  const { url, collection, crs, contentCrsHeader, f, contentTypeHeader } =
    new FeaturesRqManager({
      ctx,
    })
      .collectionParser()
      .crsParser()
      .outputFormatParser("JSON", ["JSON", "YAML"]);

  //Dunno why calling this function returns an object instead of array
  const [metadata] = await collection.extentQuery({ crs, mode: "collection" });

  const { links } = new FeaturesLinksManager({
    ctx,
    f,
    output_formats: ["json", "yaml"],
  })

    .self()
    .alternates()
    .override_output_formats(["yaml", "json"])
    .items(collection.id);
  const doc = {
    ...featuresCollectionDocGenerator({
      metadata,
      crs,
    }),
    links,
  };

  ctx.res
    .status(200)
    .set(...contentTypeHeader)
    .set(...contentCrsHeader);

  switch (f) {
    case "json":
      ctx.res.setBody(doc);
      break;
    case "yaml":
      ctx.res.setBody(jsonlikeToYAML(doc));
      break;
  }
}

async function getCollections(ctx: ExegesisContext): Promise<void> {
  const {
    crs,
    bbox,
    f,
    contentCrsHeader,
    contentTypeHeader,
    datetime,
    collections,
    url,
  } = new FeaturesRqManager({
    ctx,
  })
    .crsParser([CRS84])
    .datetimeParser()
    .bboxParser()
    .outputFormatParser("JSON", ["YAML", "JSON"], { strict: false });

  const { links } = new FeaturesLinksManager({
    ctx,
    f,
    output_formats: ["YAML", "JSON"],
  })
    .self()
    .alternates();
  //.collection(collections.map((c) => c.id));
  const docs: CommonTypes.Collections = {
    collections: (
      await Promise.all(
        collections.map((p) => {
          const x = p.extentQuery({ crs, mode: "collection" });

          return x;
        })
      )
    )
      .flat(2)
      .filter(
        (c) =>
          filterCollectionByBbox({ ...c, bbox }) &&
          filterCollectionByDatetime({ ...c, datetime })
      )
      .map((c) => ({
        ...featuresCollectionDocGenerator({ metadata: c, crs: crs }),
        links: new FeaturesLinksManager({ ctx, f, output_formats: [] }).items(
          c.id
        ).links,
      })),
    links,
  };

  ctx.res
    .status(200)
    .set(...contentCrsHeader)
    .set(...contentTypeHeader);
  switch (f) {
    case "json":
      ctx.res.setBody(docs);
      break;
    case "yaml":
      ctx.res.setBody(jsonlikeToYAML(docs));
      break;
  }
}

export default { getCollection, getCollections };
