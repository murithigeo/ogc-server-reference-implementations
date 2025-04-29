import apiController from "./controllers/apiController.js";
import { middleware, type ExegesisOptions } from "exegesis-express";
import itemsController from "./controllers/itemsController.js";
import collectionsController from "./controllers/collectionsController.js";
import conformanceController from "./controllers/conformanceController.js";
import rootController from "./controllers/rootController.js";
import { apidocs } from "../../apidocs/index.js";
import { unexpectedQueryParamInvalidatorPlugin } from "../../common/common.utils.js";

let doc = apidocs.features;
doc = {
  ...doc,

  servers: doc.servers?.map(({ url, description }) => ({
    url: `${url}/edr`,
    description,
  })),
};
const options: ExegesisOptions = {
  controllers: {
    apiController,
    itemsController,
    collectionsController,
    conformanceController,
    rootController,
  },
  plugins: [unexpectedQueryParamInvalidatorPlugin()],
  ignoreServers: false,
};

const featuresApi = middleware(doc, options);

export default featuresApi;
