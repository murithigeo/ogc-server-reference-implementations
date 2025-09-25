import type { ExegesisContext } from "exegesis-express";
import { contenttypes } from "./constants.ts";

export function parseFormat<T extends keyof typeof contenttypes>(
  ctx: ExegesisContext,
  default_output_format: T,
  output_formats: Array<T> = [default_output_format]
): { f: T; contenttypeHeader: [string, string]; output_formats: T[] } {
  let f: T | undefined;
  const param = (ctx.params.query.f||"json").toUpperCase();
  for (const k of Object.keys(contenttypes) as Array<T>) {
    if (contenttypes[k] === param) f = k;
    else if (k === param) f = k;
    // if(f)
  }

  if (!f) {
    throw ctx.makeValidationError(`Invalid f option`, {
      in: "query",
      name: "f",
      docPath: ctx.api.pathItemPtr,
    });
  }
  // ctx.params.query.f = f;
  ctx["ectx"]["format"] = f;
  return {
    f,
    output_formats,
    contenttypeHeader: [`content-type`, contenttypes[f]],
  };
}
