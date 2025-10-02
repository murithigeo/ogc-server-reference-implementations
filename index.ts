import { WebSocketExpress } from "websocket-express";
import cors from "cors";
import edr, { asyncapiAddon } from "@template/edr";
import features from "@template/features";
import logger from "./logger.ts";
import { getHtmlDocument } from "@scalar/core/libs/html-rendering";
import fs from "node:fs";
import http from "node:http";
import express from "express";

fs.readdir("./data", (err, files) => {
  if (err) console.error(err);
  else console.log(files);
});
// const app = new WebSocketExpress();
const app=express()
app.use(cors());

app.use(logger);
app.get("/", (_, res) => {
  res.set("content-type", "text/html").send(
    getHtmlDocument({
      sources: [
        { title: "Features App", url: "/features/api?f=json" },
        { title: "Edr App", url: "/edr/api?f=json", default: true },
      ],
    })
  );
});
app.use("/features", await features);

// app.use("/edr", asyncapiAddon);
app.use("/edr", await edr);

const server = http.createServer(app);
// app.attach(server);
export default server;
