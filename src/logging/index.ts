import type { NextFunction, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import morgan from "morgan";
import process from "node:process";
import type { HttpIncomingMessage } from "exegesis-express";
import type { ServerResponse } from "node:http";
export default function requestLogger(
  req: HttpIncomingMessage,
  _: ServerResponse,
  next: NextFunction
) {
  if (process.env.NODE_ENV !== "production") {
    if (!fs.existsSync(path.join(import.meta?.dirname!, "/logs.rest"))) {
      fs.openSync(path.join(import.meta?.dirname!, "/logs.rest"), "w");
    }
    morgan.token("host", (req) => req.get("host"));
    morgan.token("protocol", (req) => req.protocol);
    //morgan.token("content-type",(res)=>res.headers["content-type"])
    // Remember to add options to log the POST requests
    morgan(
      "### :date[iso] status :status :response-time ms - :res[content-type] :res[content-length] \n :method :protocol://:host:url",
      {
        stream: fs.createWriteStream(
          path.join(import.meta?.dirname!, "/logs.rest"),
          {
            flags: "a",
          }
        ),
      }
    )(req, _, next);
  }
  //next();
}
