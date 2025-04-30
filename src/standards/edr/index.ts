import rootController from "./controllers/rootController.js";
import apiController from "./controllers/apiController.js";
import conformanceController from "./controllers/conformanceController.js";
import collectionsController from "./controllers/collectionsController.js";
import areaController from "./controllers/areaController.js";
import corridorController from "./controllers/corridorController.js";
import cubeController from "./controllers/cubeController.js";
import itemsController from "./controllers/itemsController.js";
import locationsController from "./controllers/locationsController.js";
import positionController from "./controllers/positionController.js";
import radiusController from "./controllers/radiusController.js";
import trajectoryController from "./controllers/trajectoryController.js";
import { middleware, type ExegesisOptions } from "exegesis-express";
import { postToGetEdrPlugin } from "./plugins/postToGetEdrPlugin.js";
import { apidocs } from "../../apidocs/index.js";

//console.log(doc)
const options: ExegesisOptions = {
  plugins: [postToGetEdrPlugin()],
  //lazyCompileValidationSchemas: true,
  //customFormats: { datetimeRegex },
  controllers: {
    rootController,
    apiController,
    conformanceController,
    collectionsController,
    areaController,
    corridorController,
    cubeController,
    itemsController,
    locationsController,
    positionController,
    radiusController,
    trajectoryController,
  },
};
const edrApi = middleware(apidocs.edr, options);
export default edrApi;
