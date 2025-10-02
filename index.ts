import { WebSocketExpress } from "websocket-express";
import cors from "cors";
import edr, { asyncapiAddon } from "@template/edr";
import features from "@template/features";
import logger from "./logger.ts";
import { getHtmlDocument } from "@scalar/core/libs/html-rendering";
import "express";
const app = new WebSocketExpress();
// const router=aw
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

export default app.createServer();
