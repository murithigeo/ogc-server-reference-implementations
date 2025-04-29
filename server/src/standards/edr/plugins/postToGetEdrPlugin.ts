import { HttpError } from "exegesis";
import type { ExegesisPlugin, ExegesisPluginContext } from "exegesis-express";

/**
 * @description Service POST request instead of GET requests without duplicating code
 */
export function postToGetEdrPlugin(): ExegesisPlugin {
  return {
    info: { name: "exegesis-post-to-get" },
    makeExegesisPlugin: () => {
      return {
        postSecurity: async (ctx: ExegesisPluginContext) => {
          if (ctx.req.method === "POST") {
            const requestBody = await ctx.getRequestBody();
            const params = await ctx.getParams();
            params.query = { ...params.query, ...requestBody };
          }
        },
      };
    },
  };
}
