import type { ExegesisContext } from "exegesis-express";
import { EdrLinksManager, EdrRqManager } from "../edr.utils.ts";

async function getPositionAtCollection(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    crs,
    f,
    contentCrsHeader,
    output_formats,
    contentTypeHeader,
    datetime,
    coords,
    limit,
    offset,
    z,
    parameters,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("position")
    .crsParser()
    .coordsParser()
    .parameterParser()
    .outputFormatParser()
    .datetimeParser()
    .zParser()
    .offsetParser()
    .limitParser();

  const { data, numberMatched } = await collection.query({
    server:ctx.api.serverObject!,
    offset,
    limit,
    crs,
    parameters,
    f,
    spatial: { query_type: "position", coords, datetime, z },
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
async function getPositionAtInstance(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    crs,
    f,
    contentCrsHeader,
    contentTypeHeader,
    datetime,
    coords,
    limit,
    offset,
    output_formats,
    z,
    parameters,
    instanceId,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("position")
    .crsParser()
    .coordsParser()
    .parameterParser()
    .outputFormatParser()
    .datetimeParser()
    .zParser()
    .offsetParser()
    .limitParser();

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    offset,
    limit,
    crs,
    instanceId,
    parameters,
    f,
    spatial: { query_type: "position", coords, datetime, z },
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
    .setBody({ ...data, links })
}
export default {
  getPositionAtCollection,
  getPositionAtInstance,
};
