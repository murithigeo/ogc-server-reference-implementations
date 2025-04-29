import type { ExegesisContext } from "exegesis-express";
import { EdrLinksManager, EdrRqManager } from "../edr.utils.ts";

async function getItemsAtCollection(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    datetime,
    parameters,
    output_formats,
    z,
    crs,
    bbox,
    limit,
    offset,
    f,
    contentCrsHeader,
    contentTypeHeader,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("items")
    .crsParser()
    .bboxParser()
    .parameterParser()
    .datetimeParser()
    .outputFormatParser()
    .limitParser()
    .offsetParser();

  const { data,numberMatched } = await collection.query({
    server:ctx.api.serverObject!,
    parameters,
    offset,
    f,
    limit,
    crs,
    spatial: { bbox, query_type: "items", datetime, z },
  });

  const { links } = new EdrLinksManager({ ctx, f, output_formats })
    .self()
    .alternates()
    .paginationLinks(numberMatched, limit, offset)
    .override_output_formats(["json", "yaml"])
    .collection(collection.id);

  ctx.res
    .set(...contentTypeHeader)
    .set(...contentCrsHeader)
    .setBody({ ...data, links });

  ctx.res.end();
}

async function getItemAtCollection(ctx: ExegesisContext): Promise<void> {
  const { itemId } = ctx.params.path;
  const {
    collection,
    parameters,
    crs,
    limit,
    offset,
    output_formats,

    f,
    contentCrsHeader,
    contentTypeHeader,
    instanceId,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("items")
    .crsParser()
    .parameterParser()
    .datetimeParser()
    .outputFormatParser()
    .limitParser()
    .offsetParser();

  const {data,numberMatched} = await collection.query({
    server:ctx.api.serverObject!,
    parameters,
    offset,
    limit,
    crs,
    instanceId,
    itemId,
    f,
    //spatial: { bbox, query_type: "items", datetime, z },
  });

  if (!numberMatched) throw ctx.makeError(404, `No item found`);
  const { links } = new EdrLinksManager({ ctx, f, output_formats })
    .self()
    .alternates()
    .override_output_formats(["json", "yaml"])
    //.items()
    //.collectionBasedQueryType(collection.id,"items",default_output_format)
    .collection(collection.id);

  ctx.res
    .set(...contentTypeHeader)
    .set(...contentCrsHeader)
    .setBody({ ...data, links })
    .end();
}
async function getItemsAtInstance(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    datetime,
    parameters,
    output_formats,
    z,
    crs,
    bbox,
    limit,
    offset,
    f,
    contentCrsHeader,
    contentTypeHeader,
    instanceId,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("items")
    .crsParser()
    .bboxParser()
    .parameterParser()
    .datetimeParser()
    .outputFormatParser()
    .limitParser()
    .offsetParser();

  const { data,numberMatched } = await collection.query({
    server:ctx.api.serverObject!,
    parameters,
    offset,
    limit,
    f,
    crs,
    instanceId,
    spatial: { bbox, query_type: "items", datetime, z },
  });

  const { links } = new EdrLinksManager({ ctx, f, output_formats })
    .self()
    .alternates()
    .paginationLinks(numberMatched, limit, offset)
    .override_output_formats(["json", "yaml"])
    .collection(collection.id);
  ctx.res
    .set(...contentTypeHeader)
    .set(...contentCrsHeader)
    .setBody({ ...data, links })
    .end();
}

async function getItemAtInstance(ctx: ExegesisContext): Promise<void> {
  const { itemId } = ctx.params.path;
  const {
    collection,
    parameters,
    crs,
    output_formats,
    limit,
    offset,
    f,
    contentCrsHeader,
    contentTypeHeader,
    instanceId,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("items")
    .crsParser()
    .parameterParser()
    .outputFormatParser()
    .limitParser(1, 1)
    .offsetParser();

  const { data } = await collection.query({
    server:ctx.api.serverObject!,
    parameters,
    offset,
    limit,
    crs,
    instanceId,
    f,
    itemId,
    //spatial: { bbox, query_type: "items", datetime, z },
  });

  const { links } = new EdrLinksManager({ ctx, f, output_formats })
    .self()
    .alternates()
    .override_output_formats(["json", "yaml"])
    .toInstance(collection.id, instanceId!);
  ctx.res
    .set(...contentTypeHeader)
    .set(...contentCrsHeader)
    .setBody({ ...data, links });
}

export default {
  getItemAtCollection,
  getItemsAtInstance,
  getItemsAtCollection,
  getItemAtInstance,
};
