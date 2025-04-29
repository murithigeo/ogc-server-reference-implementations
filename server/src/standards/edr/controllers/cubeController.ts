import type { ExegesisContext } from "exegesis-express";
import { EdrLinksManager, EdrRqManager } from "../edr.utils.js";

async function getCubeAtCollection(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    crs,
    parameters,
    output_formats,
    z,
    datetime,
    f,
    bbox,
    contentCrsHeader,
    contentTypeHeader,
    limit,
    offset,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("cube")
    .crsParser()
    .bboxParser()
    //Parse z after bbox because z parameter takes precedence
    .zParser()
    .parameterParser()
    .datetimeParser()
    .outputFormatParser()
    .offsetParser()
    .limitParser();

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    crs,
    parameters,
    limit,
    offset,
    f,
    spatial: { query_type: "cube", datetime, z, bbox: bbox! },
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
const getCubeAtInstance = async (ctx: ExegesisContext): Promise<void> => {
  const {
    collection,
    crs,
    instanceId,
    parameters,
    z,
    datetime,
    f,
    output_formats,
    bbox,
    contentCrsHeader,
    contentTypeHeader,
    limit,
    offset,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .dataQueryParser("cube")
    .crsParser()
    .bboxParser()
    //Parse z after bbox because z parameter takes precedence
    .zParser()
    .parameterParser()
    .datetimeParser()
    .outputFormatParser()
    .offsetParser()
    .limitParser();

  const { data, numberMatched } = await collection.query({
    server: ctx.api.serverObject!,
    crs,
    f,
    parameters,
    limit,
    instanceId,
    offset,
    spatial: { query_type: "cube", datetime, z, bbox: bbox! },
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
};
export default { getCubeAtCollection, getCubeAtInstance };
