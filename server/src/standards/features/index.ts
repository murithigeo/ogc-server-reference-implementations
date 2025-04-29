import apiController from './controllers/apiController.ts';
import { middleware, type ExegesisOptions } from 'exegesis-express';
import itemsController from './controllers/itemsController.ts';
import collectionsController from './controllers/collectionsController.ts';
import conformanceController from './controllers/conformanceController.ts';
import rootController from './controllers/rootController.ts';
import { apidocs } from '../../apidocs/index.ts';
import { unexpectedQueryParamInvalidatorPlugin } from '../../common/common.utils.ts';

const doc = apidocs.features;
doc.servers = doc.servers?.map(({ url, description }) => ({ url: `${url}/features`, description }));
const options: ExegesisOptions = {
	controllers: {
		apiController,
		itemsController,
		collectionsController,
		conformanceController,
		rootController
	},
	plugins: [unexpectedQueryParamInvalidatorPlugin()],
	ignoreServers:false
};

const featuresApi = middleware(doc, options);

export default featuresApi;
