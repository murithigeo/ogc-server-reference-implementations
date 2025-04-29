import type { ExegesisContext } from "exegesis-express";
import { EdrLinksManager, EdrRqManager } from "../edr.utils.js";

async function getRadiusAtCollection(ctx: ExegesisContext): Promise<void> {
  const {
    crs,
    f,
    contentCrsHeader,
    contentTypeHeader,
    datetime,
    radius,
    offset,
    limit,
    output_formats,
    z,
    coords,
    parameters,
    collection,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .crsParser()
    .coordsParser()
    .dataQueryParser("radius")
    .radiusParser()
    .parameterParser()
    .outputFormatParser()
    .datetimeParser()
    .zParser()
    .datetimeParser()
    .offsetParser()
    .limitParser()
    .radiusParser();

  const { data, numberMatched } = await collection.query({
    server:ctx.api.serverObject!,
    offset,
    limit,
    crs,
    parameters,
    f,
    spatial: { query_type: "radius", coords, datetime, z, radius },
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
    .setBody({ data, links });
}
async function getRadiusAtInstance(ctx: ExegesisContext): Promise<void> {
  const {
    crs,
    f,
    contentCrsHeader,
    contentTypeHeader,
    datetime,
    radius,
    offset,
    output_formats,
    limit,
    z,
    instanceId,
    coords,
    parameters,
    collection,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .crsParser()
    .coordsParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("radius")
    .radiusParser()
    .parameterParser()
    .outputFormatParser()
    .datetimeParser()
    .zParser()
    .datetimeParser()
    .offsetParser()
    .limitParser()
    .radiusParser();

  const { data, numberMatched } = await collection.query({
    server:ctx.api.serverObject!,
    offset,
    limit,
    crs,
    parameters,
    instanceId,
    f,
    spatial: { query_type: "radius", coords, datetime, z, radius },
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
export default { getRadiusAtCollection, getRadiusAtInstance };
