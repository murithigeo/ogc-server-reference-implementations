import { HttpError, ValidationError } from "exegesis";
import type { ExegesisPlugin, ExegesisPluginContext } from "exegesis-express";

/**
 * @description Service POST request instead of GET requests without duplicating code
 */
export function postToGetEdrPlugin(): ExegesisPlugin {
  return {
    info: { name: "exegesis-post-to-get" },
    makeExegesisPlugin: () => {
      return {
        postRouting: async (ctx: ExegesisPluginContext) => {
          if (ctx.req.method === "POST") {
            const url = new URL(
              `${ctx.api.serverObject?.url!}/${ctx.req.url!}`
            );
            const queryParams = url.searchParams.keys().toArray();
            if (!!queryParams.length) {
              throw new ValidationError(
                queryParams.map((name) => ({
                  message: `unexpected query parameter on a POST endpoint`,
                  location: {
                    name,
                    in: "query",
                    docPath: ctx.api.pathItemPtr,
                  },
                }))
              );
            }
            const requestBody = await ctx.getRequestBody();
            const params = await ctx.getParams();
            params.query = { ...params.query, ...requestBody };
          }
        },
      };
    },
  };
}
