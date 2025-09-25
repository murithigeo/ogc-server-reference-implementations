import type { ExegesisContext } from "exegesis-express";
import {
  parseFormat,
  type Datetime,
  type Elevation,
} from "@template/utils";
import type { Dataset } from "../config.ts";

// These endpoints are expected to serve GeoJSON data
function getLocationsAtCollection(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const locations = dataset.data_queries.locations!;

  const { f, contenttypeHeader } = parseFormat(
    ctx,
    locations.default_output_format,
    locations.output_formats
  );
  const doc = locations.handler({
    ...ctx["ectx"],
  });
  let data;
  switch (f) {
    case "HTML":
    case "GEOJSON":
    default:
      data = doc;
  }
  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody(data);
}

function getLocationAtCollection(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const locations = dataset.data_queries.locations!;

  const { f, contenttypeHeader } = parseFormat(
    ctx,
    locations.default_output_format,
    locations.output_formats
  );
  const doc = locations.handler({ ...ctx["ectx"] });
  let data;
  switch (f) {
    case "HTML":
    case "GEOJSON":
    // ctx.res.set(...contenttypeHeader)
    default:
      data = doc;
  }
  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody(data);
}

async function getLocationsAtInstance(ctx: ExegesisContext): Promise<void> {
  const dataset: Dataset = ctx["ectx"].dataset;
  const locations = dataset.data_queries.locations!;

  const { f, contenttypeHeader } = parseFormat(
    ctx,
    locations.default_output_format,
    locations.output_formats
  );
  const doc = await locations.handler({
    server: ctx.api.serverObject?.url!,
    ...ctx["ectx"],
    instanceId: ctx.params.path.instanceId,
  });
  let data;
  switch (f) {
    case "HTML":
    case "GEOJSON":
    // ctx.res.set(...contenttypeHeader)
    default:
      data = doc;
  }
  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody(data);
}

async function getLocationAtInstance(ctx: ExegesisContext): Promise<void> {
  const dataset = ctx["ectx"].dataset;
  const locations = dataset.data_queries.locations!;

  const { f, contenttypeHeader } = parseFormat(
    ctx,
    locations.default_output_format,
    locations.output_formats
  );
  const doc = await locations.handler({
    ...ctx["ectx"],
    server: ctx.api.serverObject?.url!,
    instanceId: ctx.params.path.instanceId,
    locationId: ctx.params.path.locationId,
  });
  let data;
  switch (f) {
    case "HTML":
    case "GEOJSON":
    // ctx.res.set(...contenttypeHeader)
    default:
      data = doc;
  }
  ctx.res
    .status(200)
    .set(...contenttypeHeader)
    .setBody(data);
}

export default {
  "one@locations@collection": getLocationAtCollection,
  "all@locations@instance": getLocationsAtInstance,
  "all@locations@collection": getLocationsAtCollection,
  "one@locations@instance": getLocationAtInstance,
};

type LocationsContext = {
  dataset: Dataset;
  bbox?: GeoJSON.Polygon;
  datetime?: Datetime;
  z?: Elevation;
  crs: string;
};
