import path from "node:path";
import process from "node:process";
import { middleware } from "exegesis-express";
import {
  coordsPlugin,
  instanceIdPlugin,
  parameterNamePlugin,
  post2getPlugin,
  querytypePlugin,
  resolutionPlugin,
  unitConverterPlugin,
} from "./plugins.ts";
import {
  collectionIdPlugin,
  setServerSuffix,
  bboxPlugin,
  elevationPlugin,
  crsParamPlugin,
  datetimePlugin,
  makeExtraContext,
} from "@template/utils/";
import config from "./config.ts";
import controllers from "./controllers/index.ts";
export default middleware(path.join(process.cwd(), "./edr/openapi.yaml"), {
  controllers,
  plugins: [
    makeExtraContext(),
    post2getPlugin(),
    setServerSuffix("edr"),
    collectionIdPlugin(config.datasets),
    instanceIdPlugin(),
    crsParamPlugin(),
    coordsPlugin(),
    datetimePlugin(),
    elevationPlugin(),
    bboxPlugin("crs"),
    querytypePlugin(),
    parameterNamePlugin(),
    unitConverterPlugin(),
    resolutionPlugin(),
  ],
  lazyCompileValidationSchemas: true,
});
export * from "./types.d.ts";
export {default as asyncapiAddon} from "./asyncapi/index.ts"