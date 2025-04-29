import type { ExegesisContext } from "exegesis-express";
import {
  edrCollectionDocGenerator,
  EdrLinksManager,
  EdrRqManager,
} from "../edr.utils.ts";
import { CRS84 } from "../../../common/utils/CrsManager.ts";
import {
  filterCollectionByBbox,
  filterCollectionByDatetime,
  filterCollectionByZ,
  jsonlikeToYAML,
} from "../../../common/common.utils.ts";

async function getCollections(ctx: ExegesisContext): Promise<void> {
  /* One of these operations may be causing a premature 404 response */
  const {
    output_formats,
    datetime,
    bbox,
    crs,
    f,
    z,
    collections: _allCollections,
    contentCrsHeader,
    contentTypeHeader,
  } = new EdrRqManager({ ctx })
    .datetimeParser()
    .crsParser([CRS84])
    .bboxParser()
    .outputFormatParser("JSON", ["JSON", "YAML"]);

  const linkManager = new EdrLinksManager({ ctx, output_formats, f });
  const collections = (
    await Promise.all(
      _allCollections.map(
        async (c) => await c.extentQuery({ crs, mode: "collection" })
      )
    )
  )
    .flat(2)
    .filter(
      (metadata) =>
        filterCollectionByDatetime({ ...metadata, datetime }) &&
        filterCollectionByBbox({ ...metadata, bbox }) &&
        filterCollectionByZ({ ...metadata, z })
    )
    .map((c) => {
      const doc = edrCollectionDocGenerator({
        metadata: { ...c },
        ctx,
        crs,
      });
      return {
        ...doc,
        links: Object.values(doc.data_queries)
          .map(
            ({ link: { variables: _variables, ...others } }: EdrTypes.LinkObject) =>
              others
          )
          .concat(
            ...new EdrLinksManager({ output_formats, f, ctx }).collection(
              doc.id
            ).links
          ),
      };
    });

  const colls: EdrTypes.Collections = {
    collections,

    links: linkManager.self().alternates().links,
  };

  ctx.res
    .setStatus(200)
    .set(...contentCrsHeader)
    .set(...contentTypeHeader);

  switch (f) {
    case "json":
      ctx.res.setBody(colls);
      break;
    case "yaml":
      ctx.res.setBody(jsonlikeToYAML(colls));
      break;
  }
  ctx.res.end();
}
async function getCollection(ctx: ExegesisContext): Promise<void> {
  const {
    collection,
    crs,
    contentTypeHeader,
    contentCrsHeader,
    output_formats,
    f,
  } = new EdrRqManager({ ctx })
    .collectionParser()
    .crsParser()
    .outputFormatParser("JSON", ["JSON", "YAML"]);

  const [metadata] = await collection.extentQuery({ crs, mode: "collection" });
  let mainbody = edrCollectionDocGenerator({
    metadata,
    ctx,
    crs,
    collectionId: collection.id,
  });
  //delete mainbody.data_queries.instances;
  mainbody = {
    ...mainbody,
    links: Object.values(mainbody.data_queries)
      .map(({ link: { variables:_variables, ...others } }: EdrTypes.LinkObject) => others)
      .concat(
        ...new EdrLinksManager({ ctx, f, output_formats }).self().alternates()
          .links
      ),
  };
  ///};
  // Delete this data query object because it re

  ctx.res
    .status(200)
    .set(...contentCrsHeader)
    .set(...contentTypeHeader);

  switch (f) {
    case "json":
      ctx.res.setBody(mainbody);
      break;
    case "yaml":
      ctx.res.setBody(jsonlikeToYAML(mainbody));
      break;
  }
  ctx.res.end();
}

async function getInstances(ctx: ExegesisContext): Promise<void> {
  const {
    crs,
    collection,
    bbox,
    z,
    output_formats,
    datetime,
    contentCrsHeader,
    contentTypeHeader,
    f,
  } = new EdrRqManager({
    ctx,
  })
    .collectionParser()
    .dataQueryParser("instances")
    .crsParser()
    .bboxParser()
    .datetimeParser()
    .outputFormatParser();

  const instances: EdrTypes.Collection[] = (
    await collection.extentQuery({ crs, mode: "instances" })
  )
    .filter(
      (metadata) =>
        filterCollectionByBbox({ ...metadata, bbox }) &&
        filterCollectionByZ({ ...metadata, z }) &&
        filterCollectionByDatetime({ ...metadata, datetime })
    )
    .map((c) => {
      let doc = edrCollectionDocGenerator({
        metadata: c,
        crs,
        ctx,
        collectionId: collection.id,
      });
      delete doc.data_queries.instances;
      doc = {
        ...doc,
        links: Object.values(doc.data_queries)
          .map(({ link: { variables:_variables, ...others } }) => others)
          .concat(
            new EdrLinksManager({ ctx, f, output_formats }).toInstance(
              collection.id,
              doc.id
            ).links
          ),
      };
      return doc;
    });

  const doc: EdrTypes.Instances = {
    instances,

    links: new EdrLinksManager({ ctx, f, output_formats }).self().alternates()
      .links,
  };

  ctx.res.set(...contentCrsHeader).set(...contentTypeHeader);
  switch (f) {
    case "json":
      ctx.res.setBody(doc);
      break;
    case "yaml":
      ctx.res.setBody(jsonlikeToYAML(doc));
      break;
  }
  ctx.res.end();
}

async function getInstance(ctx: ExegesisContext) {
  const {
    crs,
    collection,
    contentCrsHeader,
    contentTypeHeader,
    f,
    instanceId,
    output_formats,
  } = new EdrRqManager({
    ctx,
    //collections: services.edr,
  })
    .collectionParser()
    .dataQueryParser("instances")
    .instanceParser()
    .crsParser()
    .outputFormatParser();

  const [instance] = await collection.extentQuery({
    crs,
    instanceId,
    mode: "instances",
  });
  if (!instance) {
    throw ctx.makeError(404, "no resource found");
  }

  let mainbody = edrCollectionDocGenerator({
    metadata: instance,
    crs,
    ctx,
    collectionId: collection.id,
  });
  mainbody = {
    ...mainbody,
    links: Object.values(mainbody.data_queries)
      .map(({ link: { variables: _, ...rest } }: EdrTypes.LinkObject) => rest)
      .concat(
        new EdrLinksManager({ ctx, f, output_formats }).self().alternates()
          .links
      ),
  };
  ctx.res.set(...contentCrsHeader).set(...contentTypeHeader);

  switch (f) {
    case "json":
      ctx.res.setBody(mainbody);
      break;
    case "yaml":
      ctx.res.setBody(jsonlikeToYAML(mainbody));
      break;
  }
  ctx.res.end();
}

export default { getInstance, getInstances, getCollection, getCollections };
