import type { ExegesisRoute, oas3, OAS3ApiInfo } from 'exegesis-express';

declare module 'exegesis-express' {
	interface ExegesisContextBase {
		api: OAS3ApiInfo;
	}
	interface ExegesisContext {
		api: OAS3ApiInfo;
	}
	interface ExegesisPluginContext {
		route: ExegesisRoute;
		api: OAS3ApiInfo;
	}
}
