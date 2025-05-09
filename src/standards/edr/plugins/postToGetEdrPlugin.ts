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
        postSecurity: async (ctx: ExegesisPluginContext) => {
          if (ctx.req.method !== "POST") return;
          const url = new URL(`${ctx.api.serverObject?.url!}/${ctx.req.url!}`);
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
          const params = await ctx.getParams();
          const { "parameter-name": PN, ...others } =
            await ctx.getRequestBody();

          if (PN && Array.isArray(PN)) {
            others["parameter-name"] = PN.join(",");
          }
          params.query = others;
        },
      };
    },
  };
}
