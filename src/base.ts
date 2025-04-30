import { middleware, type ExegesisContext } from "exegesis-express";
import { apidocs } from "./apidocs/index.js";
import { scalar } from "./common/utils/scalar.js";

const doc = apidocs.base;

const troubleshooterApi = middleware(doc, {
  controllers: {
    helloController: { sayHello },
    serverRoot: { getServerRoot },
    rootApi: { seeThisDoc },
  },
});

function sayHello(ctx: ExegesisContext) {
  ctx.res.status(200).json({ message: "Hello!" }).end();
}

function seeThisDoc(ctx: ExegesisContext) {
  ctx.res
    .status(200)
    .set("content-type", "text/html")
    .setBody(scalar(ctx.api.openApiDoc));
}
function getServerRoot(ctx: ExegesisContext) {
  ctx.res.status(200).json({
    links: [
      {
        rel: "data",
        href: ctx.api.serverObject?.url! + `/features/`,
        type: "application/json",
        title: `OGCAPI: Features Implementation`,
      },
      {
        rel: "data",
        href: ctx.api.serverObject?.url! + `/edr/`,
        type: "application/json",
        title: `OGCAPI: EDR Implementation`,
      },
    ],
  }).end();
}

export default troubleshooterApi;
