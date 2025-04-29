import rootController from './controllers/rootController.ts';
import apiController from './controllers/apiController.ts';
import conformanceController from './controllers/conformanceController.ts';
import collectionsController from './controllers/collectionsController.ts';
import areaController from './controllers/areaController.ts';
import corridorController from './controllers/corridorController.ts';
import cubeController from './controllers/cubeController.ts';
import itemsController from './controllers/itemsController.ts';
import locationsController from './controllers/locationsController.ts';
import positionController from './controllers/positionController.ts';
import radiusController from './controllers/radiusController.ts';
import trajectoryController from './controllers/trajectoryController.ts';
import { middleware, type ExegesisOptions } from 'exegesis-express';
import { postToGetEdrPlugin } from './plugins/postToGetEdrPlugin.ts';
import { apidocs } from '../../apidocs/index.ts';

const doc = apidocs.edr;
doc.servers = doc.servers?.map(({ url, description }) => ({ url: `${url}/edr`, description }));
const options: ExegesisOptions = {
	plugins: [postToGetEdrPlugin()],
	lazyCompileValidationSchemas: true,
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
		trajectoryController
	}
};
const edrApi = middleware(doc, options);
export default edrApi;
