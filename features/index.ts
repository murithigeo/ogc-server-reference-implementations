import {
  middleware,
  type ExegesisPlugin,
  type ExegesisPluginContext,
} from "exegesis-express";
import path from "node:path";
import rootcontroller from "./controllers/rootcontroller.tsx";
import doccontroller from "./controllers/doccontroller.ts";
import conformancecontroller from "./controllers/conformancecontroller.ts";
import collectionscontroller from "./controllers/collectionscontroller.ts";
import itemscontroller from "./controllers/itemscontroller.ts";
import {
  collectionIdPlugin,
  setServerSuffix,
  crsParamPlugin,
  makeExtraContext,
  datetimePlugin,
} from "@template/utils";
import config from "./config.ts";
import { paginationPlugin, bboxPlugin, CRS84 } from "@template/utils";
import process from "node:process";

export default middleware(path.join(process.cwd(), "./features/openapi.yaml"), {
  controllers: {
    rootcontroller,
    doccontroller,
    conformancecontroller,
    collectionscontroller,
    itemscontroller,
  },
  plugins: [
    makeExtraContext(),
    ((allowList: string[]): ExegesisPlugin => {
      return {
        info: { name: "unexpected query params" },
        makeExegesisPlugin() {
          return {
            postSecurity: async (ctx: ExegesisPluginContext) => {
              const url = new URL(ctx.req?.url!, ctx.api.serverObject!.url);
              const validParams = [
                ...Object.keys((await ctx.getParams()).query),
                ...allowList,
              ];
              const unexpectedParams = Array.from(url.searchParams
                .keys())
                .filter((key) => !validParams.includes(key));
              if (unexpectedParams.length > 0) {
                throw ctx.makeValidationError(
                  "unexpected query parameters requested",
                  {
                    docPath: ctx.api.pathItemPtr,
                    name: unexpectedParams.join(","),
                    in: "query",
                  }
                );
              }
            },
          };
        },
      };
    })([]),
    setServerSuffix("features"),
    collectionIdPlugin(config.datasets),
    crsParamPlugin(),
    ((): ExegesisPlugin => ({
      info: { name: "exegesis-plugin-bbox-crs" },
      makeExegesisPlugin: () => ({
        postSecurity: async (ctx: ExegesisPluginContext) => {
          const params = await ctx.getParams();
          const dataset: { id: string; crs: Array<string> } =
            ctx["ectx"]["dataset"];
          if (!("bbox-crs" in params.query)) return;
          const bboxCrs = params.query["bbox-crs"] || CRS84;
          const value = dataset.crs.find((c) => c === bboxCrs);
          if (!value) {
            throw ctx.makeValidationError(`dataset does not support this crs`, {
              in: "query",
              name: "bbox-crs",
              docPath: ctx.api.pathItemPtr,
            });
          }
          ctx["ectx"]["bbox-crs"] = value;
        },
      }),
    }))(),
    bboxPlugin("bbox-crs"),
    paginationPlugin(70),
    datetimePlugin(),
  ],
});
