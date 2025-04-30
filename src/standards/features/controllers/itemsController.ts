import type { ExegesisContext } from "exegesis-express";
import { FeaturesLinksManager, FeaturesRqManager } from "../features.utils.js";
//import { jsonlikeToYAML } from "../../../common/common.utils.js";

async function getItem(ctx: ExegesisContext): Promise<void> {
  const { featureId: itemId } = ctx.params.path;
  
  ctx.params.query.f =
    ctx.params.query.f.toUpperCase() === "JSON"
      ? "GeoJSON"
      : ctx.params.query.f;
  const {
    collection,
    crs,
    contentCrsHeader,
    output_formats,
    offset,
    limit,
    f,
    contentTypeHeader,
  } = new FeaturesRqManager({
    ctx,
  })
    .collectionParser()
    .crsParser()
    .bboxCrsParser()
    .offsetParser()
    .limitParser(1, 1)
    .outputFormatParser("JSON", ["JSON", "GEOJSON", "YAML"]);

  let { data } = await collection.query({
    server: ctx.api.serverObject!,
    f,
    itemId,
    limit,
    offset,
    parameters: [],
    crs,
  });

  const { links } = new FeaturesLinksManager({ ctx, f, output_formats })
    .self()
    .alternates()
    .items(collection.id)
    .override_output_formats(["json", "yaml"])
    .collection(collection.id);

  ctx.res
    .status(200)
    .set(...contentCrsHeader)
    .set(...contentTypeHeader)
    .setBody({ ...data, links })
    .end();
}

async function getItems(ctx: ExegesisContext): Promise<void> {
  
  ctx.params.query.f =
    ctx.params.query.f.toUpperCase() === "JSON"
      ? "GeoJSON"
      : ctx.params.query.f;

  let {
    crs,
    bboxCrs,
    bbox,
    collection,
    limit,
    offset,
    datetime,
    contentCrsHeader,
    f,
    z,
    contentTypeHeader,
  } = new FeaturesRqManager({ ctx })
    .collectionParser()
    .crsParser()
    .bboxCrsParser()
    .bboxParser()
    .limitParser()
    .offsetParser()
    .outputFormatParser("GeoJSON", ["JSON", "GEOJSON", "YAML"]);

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    limit,
    offset,
    crs,
    parameters: [],
    spatial: { query_type: "items", bboxCrs, z, datetime, bbox },
    f,
  });

  const { links } = new FeaturesLinksManager({
    ctx,
    f,
    output_formats: ["geojson", "yaml"],
  })
    .self()
    .alternates()
    //Generate links in object?
    .paginationLinks(numberMatched, limit, offset)
    .override_output_formats(["json", "yaml"])
    .collection(collection.id);

  ctx.res
    .status(200)
    .set(...contentCrsHeader)
    .set(...contentTypeHeader)
    .setBody({ ...data, links })
    .end();
}

export default { getItem, getItems };
