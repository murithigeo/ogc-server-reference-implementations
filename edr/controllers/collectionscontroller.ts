import type { ExegesisContext } from "exegesis-express";
import { parseFormat, type Link } from "@template/utils";
import type { Collection, DataQueries, Extent, Parameter } from "../types.d.ts";
import config, {
  type ExtentProps,
  type DataQueryConfig,
  type Dataset,
} from "../config.ts";
import { Links } from "../links.ts";
import { stringify } from "yaml";

function getCollections(ctx: ExegesisContext) {
  const format = parseFormat(ctx, "JSON", ["JSON", "YAML"]);
  const doc: { collections: Array<Collection>; links: Array<Link> } = {
    collections: config.datasets.map((p) => {
      ctx.params.path.collectionId = p.id;
      return asCollection(ctx, p, p.getExtent());
    }),
    links: new Links(ctx).self().alternates(format.output_formats).links,
  };
  let data;
  switch (format.f) {
    case "JSON":
      data = doc;
      break;
    case "YAML":
      data = stringify(doc);
      break;
  }
  ctx.res
    .status(200)
    .set(...format.contenttypeHeader)
    .setBody(data).end()
}
function getCollection(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const format = parseFormat(ctx, "JSON", ["JSON", "YAML"]);
  let doc = asCollection(ctx, dataset, dataset.getExtent());
  doc = {
    ...doc,
    links: doc.links.concat(
      new Links(ctx).self().alternates(format.output_formats).links
    ),
  };
  let data;
  switch (format.f) {
    case "YAML":
      data = stringify(data);
      break;
    default:
      data = doc;
  }
  ctx.res
    .status(200)
    .set(...format.contenttypeHeader)
    .setBody(data);
}

function getInstances(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const options = dataset.data_queries.instances!;
  const format = parseFormat(
    ctx,
    options.default_output_format,
    options?.output_formats || dataset.output_formats
  );
  const values = options.handler({
    server: ctx.api.serverObject?.url!,
    crs: "OGC:CRS84",
  });
  const instances = values.map((value) => {
    ctx.params.path.instanceId = value.id;
    return asCollection(ctx, { ...dataset, id: value.id }, value);
  });
  const { links } = new Links(ctx).self().alternates(format.output_formats);
  const doc = {
    instances,
    links,
  };

  let data;
  switch (format.f) {
    case "JSON":
      data = doc;
      break;
    case "YAML":
      data = stringify(data);
      break;
  }

  ctx.res
    .status(200)
    .set(...format.contenttypeHeader)
    .setBody(data);
}

function getInstance(ctx: ExegesisContext) {
  const instanceId = ctx.params.path.instanceId;
  const dataset: Dataset = ctx["ectx"].dataset;
  const format = parseFormat(
    ctx,
    dataset.data_queries.instances?.default_output_format!,
    dataset.data_queries.instances?.output_formats!
  );
  const doc = asCollection(
    ctx,
    { ...dataset, id: instanceId },
    dataset.data_queries.instances!.handler({
      instanceId,
      server: ctx.api.serverObject?.url!,
      crs: "OGC:CRS84",
    })[0]
  );
  doc.links = doc.links.concat(
    new Links(ctx).self().alternates(format.output_formats).links
  );
  let data;
  switch (format.f) {
    case "JSON":
      data = doc;
      break;
    case "YAML":
      data = stringify(doc);
      break;
  }
  ctx.res
    .status(200)
    .set(...format.contenttypeHeader)
    .setBody(data);
}

export default {
  "one@instances@collection": getInstance,
  "all@instances@collection": getInstances,
  getCollection,
  getCollections,
};

function toExtent(props: ExtentProps): Extent {
  
  if (props.temporal !== null) {
    props.temporal.sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }
  if (props.vertical !== undefined)
    props.vertical.values = Array.from(new Set(props.vertical.values))
      .filter((p) => p !== null)
      .sort((a, b) => a - b);
  return {
    spatial: {
      bbox: props.spatial.bbox,
      crs: props.spatial.crs,
      values: props.spatial.values ? props.spatial.values : undefined,
    },
    temporal: {
      trs: "Gregorian",
      interval:
        props.temporal === null
          ? [[null, null]]
          : [[props.temporal[0], props.temporal[props.temporal.length - 1]]],
      values: props.temporal,
    },
    vertical: props.vertical
      ? {
          interval:
            props.vertical.values === null
              ? [[null, null]]
              : [
                  [
                    props.vertical.values[0].toString(),
                    props.vertical.values[
                      props.vertical.values?.length - 1
                    ].toString(),
                  ],
                ],
          values:
            props.vertical.values === null
              ? null
              : props.vertical.values.map((p) => p.toString()) || null,
          vrs: props.vertical.vrs,
        }
      : undefined,
  };
}

function toDataQueries(
  ctx: ExegesisContext,
  dq: DataQueryConfig
): { data_queries: DataQueries; links: Link[] } {
  const { instanceId } = ctx.params.path;
  const data_queries: Collection["data_queries"] = {};

  for (const k of Object.keys(dq) as Array<keyof Collection["data_queries"]>) {
    const options = dq[k]!;
    // Dont generate nested instance documents
    if (k === "instances" && instanceId) continue;
    // Dont generate <query_type> if the endpoint is not allowed on .../instances/{instanceId}/{query_type}
    if (!options.allowAt.includes("instance") && instanceId) continue;
    // Dont generate <query_type> if endpoint is not allowed on collection/{collectionId}/{query_type}
    if (!options.allowAt.includes("collection") && !instanceId) continue;
    data_queries[k] = {
      link: {
        ...new Links(ctx).queryType(k, options.default_output_format),
        //@ts-expect-error variables is a union object resulting in error
        variables: {
          query_type: k,
          title: `Query this dataset using ${k} queries`,
          default_output_format: options.default_output_format,
          output_formats: options?.output_formats,
          width_units: options?.["width_units"],
          within_units: options?.["within_units"],
          multi: options?.["multi"],
          height_units: options?.["height_units"],
        } as { [x: string]: unknown },
      },
    };
  }
  return {
    data_queries,
    links: Object.values(data_queries).map(
      ({ link: { variables: _, ...p } }) => p
    ),
  };
}

function asCollection(
  ctx: ExegesisContext,
  dataset: Dataset,
  extent: ExtentProps
): Collection {
  const data_queries = toDataQueries(ctx, dataset.data_queries);
  return {
    id: dataset.id,
    title: dataset?.title,
    crs: dataset.crs,
    storageCrs: dataset.storageCrs,
    extent: toExtent(extent),
    keywords: dataset?.keywords,
    parameter_names: dataset.parameters.reduce(
      (acc: { [x: string]: Parameter }, v) => {
        acc[v.id] = {
          type: "Parameter",
          id: v.id,
          description: v?.description,
          label: v?.label,
          unit: v.unit,
          observedProperty: v.observedProperty,
          "data-type": v.dataType,
        };
        return acc;
      },
      {}
    ),
    output_formats: Array.from(
      new Set(
        Object.values(data_queries.data_queries).flatMap(
          (p: Collection["data_queries"][keyof Collection["data_queries"]]) =>
            p!.link.variables?.output_formats || []
        )
      )
    ),
    ...data_queries,
  };
}
