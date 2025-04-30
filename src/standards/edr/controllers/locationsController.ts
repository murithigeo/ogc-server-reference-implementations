import type { ExegesisContext } from "exegesis-express";
import { EdrLinksManager, EdrRqManager } from "../edr.utils.js";

//IDEA: Use a different table for locations or get the extents of each unique locationId value

// These endpoints are expected to serve GeoJSON data
async function getLocationsAtCollection(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    datetime,
    z,
    bbox,
    contentTypeHeader,
    contentCrsHeader,
    f,
    crs,
    offset,
    limit,
    output_formats,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("locations")
    .crsParser()
    .bboxParser()
    .outputFormatParser()
    .offsetParser()
    .limitParser();
  const { data, numberMatched } =
    await collection.data_queries.locations?.handler({
      bbox,
      datetime,
      limit,
      offset,
      crs,
      z,
    })!;
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

async function getLocationAtCollection(ctx: ExegesisContext): Promise<void> {
  const { locationId } = ctx.params.path;
  const {
    contentCrsHeader,
    f,
    contentTypeHeader,
    crs,
    collection,
    parameters,
    output_formats,
    offset,
    limit,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("locations")
    .crsParser()
    .parameterParser()
    .outputFormatParser()
    .limitParser()
    .offsetParser();

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    locationId,
    crs,
    parameters,
    offset,
    limit,
    f,
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

  ctx.res.end();
}

async function getLocationsAtInstance(ctx: ExegesisContext): Promise<void> {
  //const { locationId } = ctx.params.path;
  const {
    contentCrsHeader,
    f,
    contentTypeHeader,
    crs,
    bbox,
    z,
    datetime,
    collection,
    instanceId,
    offset,
    output_formats,
    limit,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("locations")
    .crsParser()
    .parameterParser()
    .outputFormatParser()
    .bboxParser()
    .zParser()
    .datetimeParser()
    .limitParser()
    .offsetParser();

  const { data, numberMatched } =
    await collection.data_queries?.locations?.handler({
      //locationId,
      bbox,
      z,
      datetime,
      instanceId,
      crs,
      //parameters,
      offset,
      limit,
    })!;
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

async function getLocationAtInstance(ctx: ExegesisContext): Promise<void> {
  const { locationId } = ctx.params.path;
  const {
    contentCrsHeader,
    f,
    contentTypeHeader,
    crs,
    output_formats,
    collection,
    parameters,
    offset,
    limit,
    instanceId,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("locations")
    .crsParser()
    .parameterParser()
    .outputFormatParser()
    .limitParser()
    .offsetParser();

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    locationId,
    instanceId,
    crs,
    parameters,
    offset,
    limit,
    f,
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
    .end();
}

export default {
  getLocationAtCollection,
  getLocationsAtInstance,
  getLocationsAtCollection,
  getLocationAtInstance,
};
