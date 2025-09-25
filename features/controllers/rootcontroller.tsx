import type { ExegesisContext } from "exegesis";
import {
  parseFormat,
  Links,
  type LandingPage,
} from "@template/utils";
import React from "react";
import { Main } from "@template/utils";
import rds from "react-dom/server";

export default {
  getLandingPage: (ctx: ExegesisContext) => {
    const { f, contenttypeHeader } = parseFormat(ctx, "JSON", ["JSON", "HTML"]);
    const doc: LandingPage = {
      title: "OGC API Features Implementation",
      links: new Links(ctx)
        .self()
        .alternates(["JSON", "HTML"])
        .serviceDoc()
        .serviceDesc()
        .collections()
        .conformance().links,
    };
    let data;
    switch (f) {
      case "HTML":
        data=(rds.renderToString(<Main title="Yeee"></Main>));
        break;
      default:
        data = doc;
        
    }
    ctx.res.set(...contenttypeHeader).setBody(data)
  },
};
