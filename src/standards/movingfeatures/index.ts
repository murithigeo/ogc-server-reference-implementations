import { apidocs } from "../../apidocs/index.ts";
import { middleware } from "exegesis-express";
import rootController from "./controllers/rootController.ts";
import serviceController from "./controllers/serviceController.ts";
import conformanceController from "./controllers/conformanceController.ts";
import collectionsController from "./controllers/collectionsController.ts";
import itemsController from "./controllers/itemsController.ts";
import tgSequenceController from "./controllers/tgSequenceController.ts";
import tpropertiesController from "./controllers/tpropertiesController.ts";

const movingfeaturesApi = middleware(apidocs.movingfeatures, {
  controllers: {
    rootController,
    serviceController,
    conformanceController,
    collectionsController,
    itemsController,
    tgSequenceController,
    tpropertiesController,
  },
  lazyCompileValidationSchemas: true,
  allowMissingControllers: true,
});
//export default movingfeaturesApi;
