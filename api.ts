import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import edr from "@template/edr";
import features from "@template/features";
import logger from "./logger.ts";
import { getHtmlDocument } from "@scalar/core/libs/html-rendering";

const app = express();
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
app.use("/edr", await edr);
export default createServer(app);
