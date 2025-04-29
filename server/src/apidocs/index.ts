import fs from "node:fs";
import YAML from "js-yaml";
import path, { basename } from "node:path";
import type { oas3 } from "exegesis-express";
import { LanHostGenerator } from "../common/utils/lanHostHandler.js";
import process from "node:process";
export const NODE_ENV = process.env.NODE_ENV || "dev";
export const PORT = process.env.PORT || 3000;

if (NODE_ENV === "production" && !process.env.BASE_URLS)
  throw new Error("BASE_URLS env variable must be set in prod");

//import { PORT } from '../index.js';
const lanAddress = new LanHostGenerator().lanAddress();

export const servers: oas3.ServerObject[] = (
  process.env?.BASE_URLS || "http://localhost"
)
  .split(",")
  .concat(
    lanAddress && typeof lanAddress === "string" && NODE_ENV !== "production"
      ? `http://${lanAddress}`
      : ""
  )
  .filter((u) => URL.canParse(u))
  .map((u) => ({ url: `${u}:${PORT}` }));

//.map((uri) => `${uri}:${PORT}`);

console.log(`Server root is: ${servers.map((p) => p.url).join(";\t")}`);
export const apidocs: {
  [key: string | "features" | "edr"]: oas3.OpenAPIObject;
} = fs
  .readdirSync(import.meta?.dirname!)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename(import.meta?.filename!) &&
      file.slice(-5) === ".yaml"
    );
  })
  .reduce((acc, current) => {
    console.log(`loaded ${current}`)
    const doc = {
      ...(YAML.load(
        fs.readFileSync(path.resolve(import.meta?.dirname!, current), "utf8")
      ) as oas3.OpenAPIObject),
    } as oas3.OpenAPIObject;
    acc[current.split(".")[0]] = doc;
    return acc;
  }, {});
