import type { ExegesisContext } from "exegesis-express";
import { EdrLinksManager, EdrRqManager } from "../edr.utils.ts";

async function getCorridorAtCollection(ctx: ExegesisContext): Promise<void> {
  const {
    f,
    datetime,
    z,
    corridor,
    coords,
    contentTypeHeader,
    contentCrsHeader,
    output_formats,
    parameters,
    collection,
    crs,
    limit,
    offset,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .coordsParser()
    .dataQueryParser("corridor")
    .crsParser()
    .datetimeParser()
    .corridorParser()
    .outputFormatParser();
  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    limit,
    offset,
    f,
    parameters,
    crs,
    spatial: { query_type: "corridor", corridor, coords, datetime, z },
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
async function getCorridorAtInstance(ctx: ExegesisContext): Promise<void> {
  const rqManager = new EdrRqManager({ ctx });
  const {
    collection,
    crs,
    f,
    instanceId,
    datetime,
    z,
    corridor,
    coords,
    parameters,
    output_formats,
    contentCrsHeader,
    contentTypeHeader,
    limit,
    offset,
  } = rqManager
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("corridor")
    .corridorParser()
    .coordsParser()
    .crsParser()
    .outputFormatParser()
    .parameterParser()
    .datetimeParser()
    .zParser()
    .offsetParser()
    .limitParser();

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    limit,
    offset,
    crs,
    f,
    parameters,
    spatial: { query_type: "corridor", corridor, coords, datetime, z },
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

  ctx.res.end();
}
export default {
  getCorridorAtCollection,
  getCorridorAtInstance,
};
