import fs from "node:fs";
import YAML from "js-yaml";
import path, { basename } from "node:path";
import type { oas3 } from "exegesis-express";
import { LanHostGenerator } from "../common/utils/lanHostHandler.ts";
//import { PORT } from '../index.ts';
export const PORT = process.env.PORT || 3000;

let urls = (process.env?.BASE_URLS || "http://localhost")
  .split(",")
  .map((str) => {
    if (!URL.canParse(str))
      throw new Error(`values of env var BASE_URLS may not be a valid URL`);
    return str;
  })
  .map((uri) => `${uri}:${PORT}`);

let lanAddress = new LanHostGenerator().lanAddress();

if (lanAddress && typeof lanAddress === "string") {
  urls.push(`http://${lanAddress}:${PORT}`);
}
if (lanAddress) urls = urls.filter((u) => !u.startsWith("http://localhost"));
console.log(`Server root is: ${urls.join(";\t")}`);
export const apidocs: {
  [key: string | "features" | "edr"]: oas3.OpenAPIObject;
} = fs
  .readdirSync(import.meta.dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename(import.meta?.filename) &&
      file.slice(-5) === ".yaml"
    );
  })
  .reduce((acc, current) => {
    const doc = {
      ...(YAML.load(
        fs.readFileSync(path.resolve(import.meta.dirname, current), "utf8")
      ) as oas3.OpenAPIObject),
      servers: urls.map((u) => ({ url: u })),
    } as oas3.OpenAPIObject;
    acc[current.split(".")[0]] = doc;
    return acc;
  }, {});
