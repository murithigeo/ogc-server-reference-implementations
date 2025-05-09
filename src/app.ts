import express from "express";
import cors from "cors";
import requestLogger from "./logging/index.js";
import edrApi from "./standards/edr/index.js";
import featuresApi from "./standards/features/index.js";
import { NODE_ENV, PORT } from "./apidocs/index.js";
import http from "node:http";
import { scalar } from "./common/utils/scalar.js";
const app = express();

app.use(cors());

app.use((req, _, next) => {
  const reqUri = new URL(req.url, `${req.protocol}://${req.get("host")}`);
  const params = Object.fromEntries(reqUri.searchParams.entries());

  if (params.datetime) {
    //The param is decode on access. The issue is that a datetime string with always contain a + sign that is decode to be whitespace. Thus, two encodes are needed. One manual, second auto
    params.datetime = encodeURIComponent(params.datetime);
  }
  if (params.bbox) {
    //Double decode the bbox parameter because sometimes it is double encoded. Especially in TeamEngine tests
    params.bbox = decodeURIComponent(decodeURIComponent(params.bbox));
  }

  Object.entries(params).forEach(([key, value]) => {
    reqUri.searchParams.set(key, value);
  });

  req.url = decodeURIComponent(reqUri.pathname + reqUri.search);
  next();
});

if (NODE_ENV !== "production") {
  app.use(requestLogger);
}
app.get("/", (_, res, next) => {
  res.setHeader("content-type", "text/html").send(
    scalar([
      { url: "/edr/api?f=json", default: true, title: `Edr API` },
      { url: "/features/api?f=json", title: `Features API` },
    ])
  );
  next();
});

app.use(await featuresApi);
app.use(await edrApi);

const server = http.createServer(app);
export default server;
