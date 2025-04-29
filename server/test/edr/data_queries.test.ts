//import { describe, expect, test } from "npm:vitest";
import { contenttypes } from "../index.ts";
import { expect } from "jsr:@std/expect";

const res = await fetch("http://localhost/edr/collections");
const _body: EdrTypes.Collection[] = (await res.json()).collections;
/*
describe.each(_body)("Data Query Tests-Main", (c) => {
  describe.each(Object.keys(c.data_queries))(
    "Data Query $c",
    (dq: keyof EdrTypes.DataQueries) => {
      const {
        link: { href, variables },
      } = c.data_queries[dq]!;
      let url = new URL(href);
      describe.skipIf(["corridor", "radius"].includes(dq))(
        `Non-[corridor,radius] tests`,
        () => {
          switch (dq) {
            case "position":
              url.searchParams.set("coords", "Point(0 0)");
              break;
            case "area":
              url.searchParams.set(
                "coords",
                `Polygon((-180 -90,-180 90,180 90,180 -90,-180 -90))`
              );
              break;
            case "cube":
              //Need to do a dry run without query params
              url.searchParams.set("bbox", "-180,-90,180,90");
              break;
            case "instances":
              //Nothing
              break;
            case "items":
              url.searchParams.set("bbox", "-180,-90,180,90");
              break;
            case "locations":
              break;
            case "trajectory":
              url.searchParams.set(
                "coords",
                "LINESTRING(-2.87 51.14, -2.98 51.36,-3.15 51.03,-3.48 50.74,-3.36 50.9)"
              );
              break;
          }
          //crs_details.
          test.each(variables.crs_details)(
            "crs_details check",
            async ({ crs }) => {
              url.searchParams.set("crs", crs);
              let _res = await fetch(url);
              expect(_res.status).toBe(200);
            }
          );

          let f_index = 0;
          //output_formats
          describe.each(
            Array.from(
              new Set([
                variables.default_output_format,
                ...variables.output_formats,
              ])
            )
          )("default_output_format+output_formats check", async (f) => {
            if (!f_index) {
              url.searchParams.set("f", f);
            }
            let _res = await fetch(url);
            test("Status 200 expected", (t) => t.expect(_res.status).toBe(200));
            test("content-type matches defined media type", (t) =>
              t
                .expect(_res.headers.get("content-type"))
                .toBe(contenttypes[f.toLowerCase()]));
            f_index += 1;
          });
        }
      );
    }
  );
});

*/
for (const { data_queries } of _body) {
  Deno.test({
    name: "Radius data query tests",
    ignore: !data_queries || !data_queries.radius,
    fn() {
      let {
        variables: { within_units, output_formats, crs_details },
        href,
      } = data_queries.radius?.link!;
      let url = new URL(href);
      Deno.test({
        name: "Error 400 if coords are omitted",
        async fn() {
          const _res = await fetch(url);
          expect(_res.status).toBe(400);
        },
      });
      //
    },
  });
}
