import type { ExegesisContext } from "exegesis";
import config, { type Dataset } from "../config.ts";
import type { Collection, Link } from "@template/utils";
import { parseFormat, Links } from "@template/utils";

export default {
  getCollectionsPage: (ctx: ExegesisContext) => {
    const { format,output_formats } = parseFormat(ctx, "JSON", ["JSON", "HTML"]);
    const doc: { collections: Collection[]; links: Link[] } = {
      collections: config.datasets.map((c) => {
        const extent = c.extent();
        const links = c.attribution || [];
        return {
          id: c.id,
          crs: c.crs,
          storageCrs: c.storageCrs,
          title: c.title,
          extent: {
            spatial: {
              bbox: extent.bbox,
              crs: extent.crs,
            },
            temporal: {
              trs: "Gregorian",
              interval: extent.interval,
            },
          },
          links: links.concat(
            new Links(ctx).collection(c.id).items(c.id).links
          ),
        };
      }),
      links: new Links(ctx).self().alternates(output_formats).links,
    };
    let data;
    switch (format) {
      case "HTML":
      default:
        data = doc;
    }
    ctx.res
      .status(200)
      .setBody(data);
  },
  getCollectionPage: (ctx: ExegesisContext) => {
    const dataset: Dataset = ctx["ectx"].dataset;
    const { format, output_formats } = parseFormat(ctx, "JSON", [
      "JSON",
      "HTML",
    ]);
    const extent = dataset.extent();
    const doc: Collection = {
      id: dataset.id,
      title: dataset.title,
      description: dataset.description,
      crs: dataset.crs,
      storageCrs: dataset.storageCrs,
      extent: {
        spatial: { bbox: extent.bbox, crs: extent.crs },
        temporal: { interval: extent.interval, trs: "Gregorian" },
      },
      links: [...(dataset.attribution || [])].concat(
        new Links(ctx).self().alternates(output_formats).items(dataset.id).links
      ),
    };
    let data;
    switch (format) {
      case "HTML":
      default:
        data = doc;
    }
    ctx.res
      .status(200)
      .setBody(data);
  },
};
