import fs from "node:fs";
import YAML from "js-yaml";
import path from "node:path";
import process from "node:process";
import type { OpenAPIObject } from "openapi3-ts";

export const apidocs = {
  edr:
    (YAML.load(
      fs.readFileSync(path.join(process.cwd(), `/src/apidocs/edr.yaml`), {
        encoding: "utf8",
      })
    ) as OpenAPIObject)
  ,
  features: YAML.load(
    fs.readFileSync(path.join(process.cwd(), `/src/apidocs/features.yaml`), {
      encoding: "utf8",
    })
  ) as OpenAPIObject
};