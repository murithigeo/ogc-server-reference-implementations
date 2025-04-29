import { isdCollection } from "./isd.service.js";
import { db, type Database } from "../models/db.js";
import {
  bboxFilter,
  geomBounds,
  nonNullGeometryFilter,
  tExtent,
  transformAsGeoJSON,
  transformGeometry,
  zExtent,
  zFilter,
} from "./utils.js";
import { ExpressionWrapper } from "kysely";
import type { SqlBool } from "kysely";
import { HttpError } from "exegesis";
import { FeaturesGeoJsonParser } from "../standards/features/features.utils.js";
import { CRS84 } from "../common/utils/CrsManager.js";

export const mountainsCollection: Services.FeaturesCollection = {
  storageCRS: "http://www.opengis.net/def/crs/OGC/0/CRS84h",
  title: "Mountains of the world as a filterable OGCAPI Features Dataset",
  id: "mountains",
  crs: [CRS84, `http://www.opengis.net/def/crs/OGC/0/CRS84h`],
  storageSRID: 4327,
  async query({ itemId, crs, offset, limit, spatial, f }) {
    const { rows = [], numberMatched } = await db.transaction().execute(async (trx) => {
      const conditions: ExpressionWrapper<
        Database,
        "features_poi.js",
        SqlBool
      >[] = [];
      if (itemId) {
        await trx
          .selectFrom("features_poi.js")
          .where("features_points.name", "=", itemId.toString())
          .executeTakeFirstOrThrow(() => new HttpError(404, "no such item"));
      }
      return (await db
        .with("vals1", (db) =>
          db
            .selectFrom("features_poi.js")
            .select([
              "name as id",
              "continent",
              "countries",
              "height_ft",
              "height_m",
              "features_points.regions",
            ])
            .select((eb) =>
              transformAsGeoJSON(
                eb,
                transformGeometry(eb, "features_points.geom", crs, 4327)
              )
            )
            .where((eb) => {
              return eb.and([
                ...bboxFilter(
                  eb,
                  "features_points.geom",
                  4327,
                  //@ts-expect-error <type narrowing issue>
                  spatial?.bboxCrs,
                  //@ts-expect-error <type narrowing issue>
                  spatial?.bbox
                ),
                nonNullGeometryFilter(eb, "features_points.geom"),
                ...zFilter(eb, "features_points.geom", spatial?.z),
              ]);
            })
            .$if(!!itemId, (eb) =>
              eb.where("features_points.name", "=", itemId?.toString()!)
            )
            .orderBy(["name asc"])
        )
        .with("vals2", (db) =>
          db
            .selectFrom("vals1")
            .selectAll()
            .orderBy(["vals1.id"])
            .limit(limit)
            .offset(offset)
        )
        .selectFrom(["vals1", "vals2"])
        .select((eb) => [
          eb.fn.jsonAgg("vals2").distinct().as("rows"),
          eb
            .cast<number>(eb.fn.countAll("vals1").distinct(), "integer")
            .as("numberMatched"),
        ])
        .executeTakeFirst())!;
    });
    const parser = new FeaturesGeoJsonParser({ rows, offset, numberMatched ,limit});
    return {
      numberMatched,
      data: itemId ? parser.getFeature() : parser.featureCollection,
    };
  },
  async extentQuery({ crs }) {
    return await db
      .selectFrom("features_poi.js")
      .select((eb) => [
        eb.val<string>("mountains").as("id"),
        ...tExtent(eb, undefined, false),
        ...geomBounds(eb, "features_points.geom", crs, 4327),
        ...zExtent(eb, "features_points.geom"),
      ])
      .execute();
  },
};

export const mountainsEdrCollection: Services.EdrCollection = {
  ...mountainsCollection,

  data_queries: {
    items: {
      servedAt: ["collection"],
      default_output_format: "GeoJSON",
      output_formats: ["GeoJSON"],
    },
  },
  parameters: [],
  keywords: ["mountains", "world"],
};
