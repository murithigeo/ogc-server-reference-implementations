import fs from "node:fs";
import YAML from "js-yaml";
import path from "node:path";
import type { oas3 } from "exegesis-express";
import { LanHostGenerator } from "../common/utils/lanHostHandler.js";
import process from "node:process";
import type { OpenAPIObject } from "openapi3-ts";
export const NODE_ENV: "production" | "dev" = process.env?.NODE_ENV || "dev";
export const PORT = process.env.PORT || 3000;

if (NODE_ENV === "production" && !process.env.BASE_URLS)
  throw new Error("BASE_URLS env variable must be set in prod");

//import { PORT } from '../index.js';
const lanAddress = new LanHostGenerator().lanAddress();

const servers: oas3.ServerObject[] = (
  process.env?.BASE_URLS || "http://localhost"
)
  .split(",")
  .concat(
    lanAddress && typeof lanAddress === "string" && NODE_ENV !== "production"
      ? `http://${lanAddress}`
      : ""
  )
  .filter((u) => URL.canParse(u))
  .map((u) => ({ url: NODE_ENV === "production" ? u : `${u}:${PORT}` }));

console.log(`Server root is: ${servers.map((p) => p.url).join(";\t")}`);

export const apidocs: {
  [key: string | "features" | "edr"]: oas3.OpenAPIObject;
} = {
  edr: {
    ...(YAML.load(
      fs.readFileSync(path.join(process.cwd(), `/src/apidocs/edr.yaml`), {
        encoding: "utf8",
      })
    ) as OpenAPIObject),
    servers: servers.map(({ url, description }) => ({
      url: `${url}/edr`,
      description,
    })),
  },
  features: {
    ...(YAML.load(
      fs.readFileSync(path.join(process.cwd(), `/src/apidocs/features.yaml`), {
        encoding: "utf8",
      })
    ) as OpenAPIObject),
    servers: servers.map(({ url, description }) => ({
      url: `${url}/features`,
      description,
    })),
  },
};
