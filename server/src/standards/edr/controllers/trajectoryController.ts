import type { ExegesisContext } from "exegesis-express";
import { EdrLinksManager, EdrRqManager } from "../edr.utils.js";

async function getTrajectoryAtCollection(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    output_formats,
    coords,
    f,
    contentTypeHeader,
    crs,
    z,
    datetime,
    parameters,
    contentCrsHeader,
    offset,
    limit,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("trajectory")
    .outputFormatParser()
    .crsParser()
    .coordsParser()
    .parameterParser()
    .datetimeParser()
    .zParser();

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    crs,
    parameters,
    limit,
    offset,
    f,
    spatial: { query_type: "trajectory", datetime, z, coords },
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

async function getTrajectoryAtInstance(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    output_formats,
    coords,
    f,
    contentTypeHeader,
    crs,
    z,
    datetime,
    instanceId,
    parameters,
    contentCrsHeader,
    offset,
    limit,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("trajectory")
    .outputFormatParser()
    .crsParser()
    .coordsParser()
    .parameterParser()
    .datetimeParser()
    .zParser();

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    crs,
    parameters,
    limit,
    offset,
    f,
    spatial: { query_type: "trajectory", datetime, z, coords },
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

/**
 * @description The Trajectory query returns data along the path defined by the coords parameter
 */
export default { getTrajectoryAtCollection, getTrajectoryAtInstance };
