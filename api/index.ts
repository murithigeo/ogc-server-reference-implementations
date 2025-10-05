import { WebSocketExpress } from "websocket-express";
import cors from "cors";
import edr, { asyncapiAddon } from "@template/edr";
import features from "@template/features";
import logger from "../logger.ts";
import { getHtmlDocument } from "@scalar/core/libs/html-rendering";
import http from "node:http";
import * as express from "express";
import process from "node:process";

const PORT = process.env.PORT || 3000;
const app = new WebSocketExpress();
app.use(cors());

app.useHTTP(logger);
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
app.useHTTP("/features", await features);

app.use("/edr", asyncapiAddon);
app.useHTTP("/edr", await edr);

const server = http.createServer();
app.attach(server);
try {
  server.listen(PORT, () => console.log(`listening on port: ${PORT}`));
} catch (error) {
  console.error(error)
  process.exit(1);
}

export default server;