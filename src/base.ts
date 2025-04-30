import { middleware, type ExegesisContext } from "exegesis-express";
import { apidocs } from "./apidocs/index.js";

const doc = apidocs.base;

const troubleshooterApi = middleware(doc, {
  controllers: { helloController: { sayHello }, serverRoot: { getServerRoot } },
});

function sayHello(ctx: ExegesisContext) {
  return ctx.res.status(200).json({ message: "Hello!" });
}

function getServerRoot(ctx: ExegesisContext) {
  return ctx.res.status(200).json({
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
  });
}

export default troubleshooterApi;
