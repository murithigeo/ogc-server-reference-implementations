import { WebSocketExpress } from "websocket-express";
import cors from "cors";
import edr, { asyncapiAddon } from "@template/edr";
import features from "@template/features";
import logger from "../logger.ts";
import { getHtmlDocument } from "@scalar/core/libs/html-rendering";
import http from "node:http";
import express from "express";
import process from "node:process";

const PORT = process.env.PORT || 8000;
const app = express();
// const app = new WebSocketExpress();
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
server.listen(PORT, () => console.log(`listening on port: ${PORT}`));

// export default server;
