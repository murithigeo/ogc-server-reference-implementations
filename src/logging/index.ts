import type { NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import morgan from "morgan";
import type { HttpIncomingMessage } from "exegesis-express";
import type { ServerResponse } from "node:http";
export default function requestLogger(
  req: HttpIncomingMessage,
  _: ServerResponse,
  next: NextFunction
) {
  let folder = path.join(process.cwd(), "/src/logging"),
    file = path.join(folder, "/logs.rest");
  
  if (!fs.existsSync(file)) {
    fs.openSync(file, "w");
  }

  morgan.token("host", (req) => req.get("host"));
  morgan.token("protocol", (req) => req.protocol);
  //morgan.token("content-type",(res)=>res.headers["content-type"])
  // Remember to add options to log the POST requests
  morgan(
    "### :date[iso] status :status :response-time ms - :res[content-type] :res[content-length] \n :method :protocol://:host:url",
    {
      stream: fs.createWriteStream(file, {
        flags: "a",
      }),
    }
  )(req, _, next);
}
