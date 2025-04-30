import { ExpressionWrapper, sql } from "kysely";
import { CRS84, CRS84Attr } from "../common/utils/CrsManager.js";
import observedproperties from "../observedProperties.js";
import units from "../units.js";
import type { EdrCollection, SpatialOptions } from "./services.d.js";
import { db } from "../models/db.js";
import {
  areaFilter,
  bboxFilter,
  corridorFilter,
  datetimeFilter,
  geomBounds,
  nonNullGeometryFilter,
  paramValueFromColumn,
  positionFilter,
  radiusFilter,
  tExtent,
  trajectoryFilter,
  transformAsGeoJSON,
  transformGeometry,
  zExtent,
  zFilter,
} from "./utils.js";
import type { SqlBool } from "kysely";
import type { Database } from "../models/db.js";
import { stf } from "../models/kysely-postgis/index.js";
import { HttpError } from "exegesis";
import pg from "pg";
import { httpcodes } from "../httpcodes/index.js";
import { EdrGeoJsonParser } from "../standards/edr/edr.utils.js";
import { CoverageJsonParser } from "../common/parsers/coverageJsonParser.js";
import { FeaturesGeoJsonParser } from "../standards/features/features.utils.js";
import type { ExpressionBuilder } from "kysely";

export const isdCollection: EdrCollection = {
  id: "isd-2025",
  title: "EDR queryable ISD Dataset",
  description:
    "The ISD (Integrated Surface Dataset) provides comprehensive data about the surface of the earth. This dataset currently hosts data for 2025 and/or African countries. This is for demo purposes only",
  crs: [
    CRS84,
    "http://www.opengis.net/def/crs/OGC/0/CRS84h",
    "http://www.opengis.net/def/crs/EPSG/0/32737",
    "http://www.opengis.net/def/crs/EPSG/0/4326",
    "http://www.opengis.net/def/crs/EPSG/0/4327",
  ],
  keywords: ["noaa", "weather", "temperature", "isd"],
  storageCRS: "http://www.opengis.net/def/crs/EPSG/0/4327",
  parameters: [
    {
      id: "temperature",
      unit: units.temperature,
      column: "isd.temperature",
      index: 1,
      observedProperty: observedproperties.temperature,
      dataType: "float",
      targetAxis: ["t"],
    },
    {
      id: "dewPointTemperature",
      unit: units.temperature,
      observedProperty: observedproperties.dewPointTemp,
      dataType: "float",
      targetAxis: ["t"],
      column: "isd.dew",
      index: 1,
    },
    {
      id: "pressure",
      dataType: "float",
      column: "isd.slp",
      index: 1,
      unit: units.pressure,
      observedProperty: observedproperties["pressure"],
      targetAxis: ["t"],
    },
    {
      id: "windDirection",
      dataType: "integer",
      column: "isd.wind",
      unit: units.windDirection,
      index: 1,
      observedProperty: observedproperties.windDirection,
      targetAxis: ["t"],
    },
    {
      id: "windType",
      dataType: "string",
      column: "isd.wind",
      index: 3,
      unit: units["windType"],
      observedProperty: observedproperties["windDirection"],
      targetAxis: ["t"],
    },
    {
      id: "windSpeed",
      dataType: "float",
      column: "isd.wind",
      index: 4,
      unit: units["windSpeed"],
      observedProperty: observedproperties["windSpeed"],
      targetAxis: ["t"],
    },
  ],
  data_queries: {
    locations: {
      output_formats: ["GeoJSON"],
      default_output_format: "GeoJSON",
      async handler({ datetime, z, bbox, crs, instanceId, limit, offset }) {
        let { rows, numberMatched } = await db
          .transaction()
          .execute(async (trx) => {
            const conditions: ExpressionWrapper<Database, "isd", SqlBool>[] =
              [];
            //if(instanceId) conditions.push()
            if (instanceId) {
              await trx
                .selectFrom("isd")
                .where((eb) => {
                  const instanceCheck = eb(
                    sql<string>`TO_CHAR(${eb.ref(
                      "isd.datetime"
                    )},'YYYY-MM-DD')`,
                    "=",
                    instanceId.toString()
                  );
                  conditions.push(instanceCheck);
                  return instanceCheck;
                })
                .executeTakeFirstOrThrow(
                  () => new HttpError(404, "no such instance")
                );
            }
            return (await trx
              .with("values1", (db) =>
                db
                  .selectFrom("isd")
                  .select((eb) => [
                    ...tExtent(eb, "isd.datetime", false),
                    "isd.country as id",
                  ])
                  .select((eb) =>
                    transformAsGeoJSON(
                      eb,
                      stf(eb).extent(
                        transformGeometry(eb, "isd.geom", crs, 4327)
                      )
                    )
                  )
                  .where((eb) => {
                    conditions.concat([
                      ...datetimeFilter(eb, "isd.datetime", datetime),
                      ...bboxFilter(eb, "isd.geom", 4327, crs, bbox),
                      ...zFilter(eb, "isd.geom", z),
                    ]);

                    return eb.and(conditions);
                  })
                  .groupBy(["isd.country"])
              )
              .with("values2", (db) =>
                db.selectFrom("values1").selectAll().limit(limit).offset(offset)
              )
              .selectFrom(["values1", "values2"])
              .select((eb) => [
                eb
                  .cast<number>(eb.fn.countAll("values1").distinct(), "integer")
                  .as("numberMatched"),
                eb.fn.jsonAgg("values2").distinct().as("rows"),
              ])
              .executeTakeFirst())!;
          });
        return {
          //To support edrGeojson, find a way to acess outer[param]
          data: new FeaturesGeoJsonParser({
            rows: rows ?? [],
            offset,
            numberMatched,
            limit,
          }).featureCollection,
          numberMatched,
        };
      },
    },
    instances: {
      default_output_format: "JSON",
      output_formats: ["JSON", "YAML"],
      default_instanceid: "2025-01-01",
    },
    items: {
      default_output_format: "GeoJSON",
      output_formats: ["GeoJSON", "YAML", "CoverageJSON"],
    },
    radius: {
      default_output_format: "JSON",
      output_formats: ["JSON", "YAML"],
      within_units: ["m"],
    },
    corridor: {
      width_units: ["m"],
      height_units: ["m"],
      output_formats: ["CoverageJSON", "GeoJSON", "JSON"],
      default_output_format: "CoverageJSON",
    },
    area: {
      default_output_format: "CoverageJSON",
      output_formats: ["CoverageJSON", "GeoJSON", "JSON"],
    },
    trajectory: {
      default_output_format: "CoverageJSON",
      output_formats: ["CoverageJSON", "GeoJSON"],
    },
    cube: {
      default_output_format: "CoverageJSON",
      output_formats: ["CoverageJSON", "GeoJSON"],
    },
    position: {
      default_output_format: "CoverageJSON",
      output_formats: ["CoverageJSON", "GeoJSON", "JSON"],
    },
  },
  storageSRID: 4327,
  async query({
    parameters,
    limit = 50,
    crs,
    instanceId,
    locationId,
    offset = 0,
    spatial,
    f,
    server,
    itemId,
  }) {
    let { rows, numberMatched } = await db
      .transaction()
      .execute(async (trx) => {
        //let eb:ExpressionBuilder<Database,"isd">;
        const conditions: ExpressionWrapper<Database, "isd", SqlBool>[] = [];
        let template = trx.selectFrom("isd"),
          _instanceBuilder = (eb: ExpressionBuilder<Database, "isd">) =>
            sql<string>`to_char(${eb.ref("datetime")},'YYYY-MM-DD')`;

        if (instanceId) {
          await template
            .where((eb) => {
              const instanceCheck = eb(_instanceBuilder(eb), "=", instanceId);
              conditions.push(instanceCheck);
              return instanceCheck;
            })
            .executeTakeFirstOrThrow(
              () => new HttpError(404, `no such instance`)
            );
        }
        if (locationId) {
          await template
            .where((eb) => {
              const check = eb("isd.country", "=", locationId.toString());
              conditions.push(check);
              return check;
            })
            .executeTakeFirstOrThrow(
              () => new HttpError(404, `no such location`)
            );
        }
        if (itemId) {
          await template
            .where((eb) => {
              const check = eb("station", "=", itemId.toString());
              conditions.push(check);
              return check;
            })
            .executeTakeFirstOrThrow(() => new HttpError(404, `no such item`));
        }

        //While it would be better to use all possible values, geojson does not have a structure to associate different key values
        const arrLimit = ["geojson", "json"].includes(f) ? 1 : undefined;

        return (await trx
          .with("values1", (db) =>
            db
              .selectFrom("isd")
              .select((eb) => [
                //station as id
                "isd.station as id",
                //country(name) as location
                "isd.country as location",
                //name (of station) as label
                "isd.name as label",
                //transform to crs config and get as geojson geometry
                transformAsGeoJSON(
                  eb,
                  transformGeometry(eb, "isd.geom", crs, this.storageSRID)
                ),
              ])
              //get variable as a array of string,number of nulls.
              //! TODO sort by date
              .select((eb) =>
                parameters.map((p) =>
                  sql<
                    (string | number | null)[]
                  >`(ARRAY_AGG(${paramValueFromColumn(
                    eb,
                    p.column,
                    p.dataType,
                    p.index
                  )}))[1:${arrLimit || sql.raw("")}]`.as(p.id)
                )
              )
              .select((eb) => [
                sql<string[]>`(ARRAY_AGG(${eb.ref("isd.datetime")}))[1:${
                  arrLimit || sql.raw("")
                }]`.as("datetime"),
                // These will be used for Edr GeoJSON which requires a datetime field
                eb.fn.max<string>("isd.datetime").as("tmax"),
                eb.fn.min<string>("isd.datetime").as("tmin"),
              ])
              .where((eb) =>
                eb.and(
                  conditions.concat(
                    ...spatialWhere({
                      eb,
                      spatial,
                      storageSRID: this.storageSRID,
                      crs,
                    })
                  )
                )
              )
              .groupBy([
                "isd.name",
                "isd.geom", //"countries.name",
                "isd.station",
                "isd.country",
              ])
          )
          .with("values2", (db) =>
            //If edr really does not support limit, then disable /{collectionId}/{query_type} so as to reduce processing time
            db.selectFrom("values1").selectAll().limit(limit).offset(offset)
          )
          .selectFrom(["values1", "values2"])
          .select((eb) => [
            eb
              .cast<number>(eb.fn.countAll("values1").distinct(), "integer")
              .as("numberMatched"),

            eb.fn.jsonAgg("values2").distinct().as("rows"),
          ])
          .executeTakeFirst())!;
      });
    rows = rows ?? [];
    let data: Awaited<ReturnType<typeof this.query>>["data"] = undefined;
    switch (f) {
      case "json":
        //Handle cases where a feature is supposed to be returned

        let parser0 = new EdrGeoJsonParser({
          server,
          rows,
          parameters: this.parameters,
          numberMatched,
          offset,
          limit,
          collectionId: this.id,
          instanceId,
        });

        if (!itemId) {
          data = parser0.edrFeatureCollection;
        } else {
          data = parser0.toEdrFeature();
        }
        break;
      case "geojson":
        let parser = new FeaturesGeoJsonParser({
          rows,
          offset,
          numberMatched,
          limit,
        });
        if (itemId) {
          data = parser.getFeature();
        } else {
          data = parser.featureCollection;
        }
        break;
      //Handle cases where a feature is supposed to be returned
      //case "yaml":
      case "coveragejson":
        const parser2 = new CoverageJsonParser({
          rows,
          crs,
          parameters: this.parameters,
        });
        if (itemId) {
          data = parser2.toCoverage().covjsonDoc;
        } else {
          data = parser2.toCoverageCollection().covjsonDoc;
        }
        break;
    }
    return { data, numberMatched: rows.length };
  },
  extentQuery: async ({ crs, mode, instanceId }) => {
    return await db
      .selectFrom("isd")
      .select((eb) => [
        mode === "instances"
          ? sql<string>`TO_CHAR(${eb.ref("isd.datetime")},'YYYY-MM-DD')`.as(
              "id"
            )
          : eb.val("isd-2025").as("id"),
        ...tExtent(eb, "isd.datetime"),
        ...zExtent(eb, "isd.geom"),
        ...geomBounds(eb, "isd.geom", crs, 4327),
      ])
      .$if(mode === "instances", (eb) =>
        eb
          .groupBy((eb) => [
            sql<string>`TO_CHAR(${eb.ref("isd.datetime")},'YYYY-MM-DD')`,
          ])
          .$if(!!instanceId, (eb) =>
            eb.where((eb) =>
              eb(
                sql<string>`TO_CHAR(${eb.ref("isd.datetime")},'YYYY-MM-DD')`,
                "=",
                instanceId?.toString()!
              )
            )
          )
      )
      .execute();
  },
};

function spatialWhere({
  eb,
  spatial,
  storageSRID,
  crs,
}: {
  eb: ExpressionBuilder<Database, "isd">;
  crs: CommonTypes.CrsConfig;
  spatial?: SpatialOptions;
  storageSRID: number;
}): ExpressionWrapper<Database, "isd", SqlBool>[] {
  const conditions: ExpressionWrapper<Database, "isd", SqlBool>[] = [];
  if (!spatial) return conditions;
  conditions.push(...datetimeFilter(eb, "datetime", spatial.datetime));

  switch (spatial.query_type) {
    case "cube":
    case "items":
      conditions.push(
        ...bboxFilter(
          eb,
          "isd.geom",

          4327,
          spatial.bboxCrs || crs,
          spatial.bbox
        )
      );
      break;
    case "corridor":
      conditions.push(
        ...corridorFilter(
          eb,
          "isd.geom",
          spatial.coords,
          spatial.corridor,
          crs,
          4327
        )
      );
      break;
    case "area":
      conditions.push(
        areaFilter(eb, "isd.geom", spatial.coords, storageSRID, crs)
      );
      break;
    case "position":
      conditions.push(
        positionFilter(eb, "isd.geom", spatial.coords, crs, storageSRID)
      );
      break;
    case "radius":
      conditions.push(
        radiusFilter(
          eb,
          "isd.geom",
          spatial.coords,
          spatial.radius,
          crs,
          storageSRID
        )
      );
      break;
    case "trajectory":
      conditions.push(
        trajectoryFilter(eb, "isd.geom", spatial.coords, crs, storageSRID)
      );
      break;
  }
  conditions.push(...zFilter(eb, "isd.geom", spatial?.z));

  conditions.push(nonNullGeometryFilter(eb, "isd.geom"));
  return conditions;
}
/*
console.log(await db.selectFrom("isd").limit(0).execute());
console.log(
  await db
    .with("vals", (db) => db.selectFrom("isd"))
    .with("vals2", (db) => db.selectFrom("isd").limit(0))
    .selectFrom(["vals", "vals2"])
    .select((eb) => eb.fn.countAll("vals").as("count"))
    .select((eb) => eb.fn.jsonAgg("vals2").as("rows"))
    .executeTakeFirst()
);

*/
