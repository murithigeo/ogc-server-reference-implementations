import type { ExegesisContext } from "exegesis-express";
import { parseFormat, type Datetime, type Elevation } from "@template/utils";
import type { Dataset } from "../config.ts";
import { Links } from "../links.ts";

// These endpoints are expected to serve GeoJSON data
async function getLocationsAtCollection(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const options = dataset.data_queries.locations!;

  const { output_formats } = parseFormat(ctx, "GEOJSON", ["GEOJSON", "JSON"]);
  const doc =await options.handleAll({
    ...ctx["ectx"],
  });
  const { links } = new Links(ctx).self().alternates(output_formats);
  ctx.res.status(200).setBody({ ...doc, links });
}

async function getLocationAtCollection(ctx: ExegesisContext) {
  const dataset: Dataset = ctx["ectx"].dataset;
  const locations = dataset.data_queries.locations!;

  const { output_formats } = parseFormat(
    ctx,
    locations.default_output_format,
    locations.output_formats || dataset.output_formats
  );
  const doc = await locations.handlerOne({
    ...ctx["ectx"],
    locationId: ctx.params.path.locId,
  });
  const { links } = new Links(ctx).self().alternates(output_formats);
  ctx.res.status(200).setBody({ ...doc, links });
}

async function getLocationsAtInstance(ctx: ExegesisContext): Promise<void> {
  const dataset: Dataset = ctx["ectx"].dataset;
  const options = dataset.data_queries.locations!;

  const { output_formats } = parseFormat(ctx, "GEOJSON", ["GEOJSON", "JSON"]);
  const doc = await options.handleAll({
    ...ctx["ectx"],
  });
  const { links } = new Links(ctx).self().alternates(output_formats);
  ctx.res.status(200).setBody({ ...doc, links });
}

async function getLocationAtInstance(ctx: ExegesisContext): Promise<void> {
  const dataset: Dataset = ctx["ectx"].dataset;
  const locations = dataset.data_queries.locations!;

  const { output_formats } = parseFormat(
    ctx,
    locations.default_output_format,
    locations.output_formats || dataset.output_formats
  );
  const doc = await locations.handlerOne({
    ...ctx["ectx"],
    locationId: ctx.params.path.locId,
  });
  const { links } = new Links(ctx).self().alternates(output_formats);
  ctx.res.status(200).setBody({ ...doc, links });
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
