import type { ExegesisPlugin, ExegesisPluginInstance } from "exegesis-express";
import type { ExegesisPluginContext } from "exegesis-express";
import type { StringCustomFormatChecker } from "exegesis-express";
import type { FeaturesRqManager } from "../standards/features/features.utils.js";
import intersects from "@turf/boolean-intersects";
import YAML from "js-yaml";

/**
 *
 * @param bbox A 4/6 item array. Uses counterclockwise direction to construct the bbox
 * @returns
 */
export const bboxToPolygon = (bbox: CommonTypes.Bbox): GeoJSON.Polygon => ({
  type: "Polygon",
  coordinates:
    bbox.length === 6
      ? [
          [
            //minx,miny,minz
            [bbox[0], bbox[1], bbox[2]],
            //maxx,miny,maxz
            [bbox[3], bbox[1], bbox[5]],
            //maxx,maxy,maxz
            [bbox[3], bbox[4], bbox[5]],
            //minx,maxy,minz
            [bbox[0], bbox[4], bbox[2]],
            //minx,miny,minz
            [bbox[0], bbox[1], bbox[2]],
          ],
        ]
      : [
          [
            //minx,miny
            [bbox[0], bbox[1]],
            //maxx,miny
            [bbox[2], bbox[1]],
            //maxx,maxy
            [bbox[2], bbox[3]],
            //minx,maxy
            [bbox[0], bbox[3]],
            //minx,miny
            [bbox[0], bbox[1]],
          ],
        ],
});

//console.log(bboxToPolygon([-180,-90,180,90]))
/**
 * validates a z param string to match the formats
 * 20 (single value)
 * 20/40 (min and max values)
 * 20,30,40 (list of values)
 * R20/10/40 (An incremental list of values)
 */
export const zRegex: StringCustomFormatChecker = {
  type: "string",
  validate: /^(R\d+\/\d+\/\d+|\d+(?:,\d+)*|\d+\/\d+|\d+)$/,
};

/**
 *
 */
export const datetimeRegex: StringCustomFormatChecker = {
  type: "string",
  validate:
    /^(\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))\/\.\.|\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))\/\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))|\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))|^\.\.\/\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9])))$/,
};

/**
 * @description The OGCAPI Features Test Suite will send a request to endpoints with an undocumented (unexpected) query param.
 * They expect the response to be 400
 * @param allowList invalid (not documented) query params to ignore if present
 * @returns {ExegesisPlugin}
 */
export function unexpectedQueryParamInvalidatorPlugin(
  allowList: string[] = []
): ExegesisPlugin {
  return {
    info: {
      name: "queryparam-validator",
    },
    makeExegesisPlugin(): ExegesisPluginInstance {
      return {
        postSecurity: async (ctx: ExegesisPluginContext) => {
          const reqUrl = new URL(ctx.req?.url!, ctx.api.serverObject?.url);

          const validSearchParams = [
            ...Object.keys((await ctx.getParams()).query),
            ...allowList,
          ];
          const allSearchParams = Array.from(
            new URLSearchParams(reqUrl.search).keys()
          );
          const unexpectedParams = allSearchParams.filter(
            (param) => !validSearchParams.includes(param)
          );
          if (unexpectedParams.length > 0) {
            unexpectedParams.forEach((param) => {
              throw ctx.makeValidationError("unexpected query parameter", {
                docPath: ctx.api.pathItemPtr,
                name: param,
                in: "query",
              });
            });
          }
        },
      };
    },
  };
}

export function filterCollectionByDatetime({
  tmin,
  tmax,
  tvalues,
  datetime,
}: {
  tmax: string | null;
  tmin: string | null;
  tvalues: string[] | null;
  datetime?: FeaturesRqManager["datetime"];
}): boolean {
  //if (!datetime) return true;
  //!Fix the unstable boolean condition
  //Datetime filtering
  const levelCheck =
    datetime?.levels && tvalues
      ? datetime.levels
          .map((l) => new Date(l).getTime())
          .every((level) =>
            tvalues.map((v) => new Date(v).getTime()).includes(level)
          )
      : true;
  const maxCheck =
    datetime?.max && tmax
      ? new Date(tmax).getTime() <= new Date(tmax).getTime()
      : true;
  const minCheck =
    datetime?.min && tmin
      ? new Date(tmin).getTime() >= new Date(tmin).getTime()
      : true;

  return levelCheck && maxCheck && minCheck;
}

export function filterCollectionByBbox({
  xmin,
  ymin,
  xmax,
  ymax,
  bbox,
}: {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  bbox?: FeaturesRqManager["bbox"];
}): boolean {
  if (!bbox) return true;
  const dbBbox = bboxToPolygon([xmin, ymin, xmax, ymax]),
    reqBbox = bboxToPolygon(bbox);
  return intersects(dbBbox, reqBbox);
}

export function jsonlikeToYAML(...args: Parameters<typeof YAML.dump>) {
  return YAML.dump(args[0], args[1]);
}

export function filterCollectionByZ({
  zmin,
  zmax,
  zvalues,
  z,
}: {
  zmin: number | null;
  zmax: number | null;
  zvalues: number[] | null;
  z: FeaturesRqManager["z"];
}) {
  const minCheck = z.min && zmin ? zmin >= z.min : true;
  const maxCheck = z.max && zmax ? zmax <= z.max : true;
  const levelCheck =
    z.levels && zvalues
      ? z.levels.every((level) => zvalues.includes(level))
      : true;
  return minCheck && maxCheck && levelCheck;
}
