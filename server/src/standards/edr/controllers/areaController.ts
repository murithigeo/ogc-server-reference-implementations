import type { ExegesisContext } from "exegesis-express";
import { EdrLinksManager, EdrRqManager } from "../edr.utils.ts";

async function getAreaAtCollection(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    coords,
    limit,
    offset,
    crs,
    f,
    contentCrsHeader,
    contentTypeHeader,
    datetime,
    output_formats,
    z,
    parameters,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .crsParser()
    .coordsParser()
    .dataQueryParser("area")
    .parameterParser()
    .offsetParser()
    .limitParser(20);

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    f,
    crs,
    offset,
    limit,
    spatial: { query_type: "area", coords, datetime, z },
    parameters,
  });
  const { links } = new EdrLinksManager({ ctx, f, output_formats })
    .self()
    .alternates()
    .paginationLinks(numberMatched, limit, offset)
    .override_output_formats(["json", "yaml"])
    .collection(collection.id);
  ctx.res
    .status(200)
    .set(...contentCrsHeader)
    .set(...contentTypeHeader)
    .setBody({ ...data, links });
}
async function getAreaAtInstance(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    coords,
    limit,
    offset,
    instanceId,
    f,
    crs,
    contentCrsHeader,
    contentTypeHeader,
    datetime,
    z,
    output_formats,
    parameters,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .coordsParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("area")
    .crsParser()
    .parameterParser()
    .outputFormatParser()
    .datetimeParser()
    .zParser()
    .offsetParser()
    .limitParser(20);

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    crs,
    offset,
    limit,
    spatial: { query_type: "area", coords, datetime, z },
    parameters,
    f,
    instanceId,
  });
  const { links } = new EdrLinksManager({ ctx, f, output_formats })
    .self()
    .alternates()
    .paginationLinks(numberMatched, limit, offset)
    .override_output_formats(["json", "yaml"])
    .toInstance(collection.id, instanceId!);
  ctx.res
    .status(200)
    .set(...contentCrsHeader)
    .set(...contentTypeHeader)
    .setBody({ ...data, links });
}
export default { getAreaAtCollection, getAreaAtInstance };
