//import { describe, expect, it, test } from 'vitest';
import { expect } from "@std/expect";
import { TEST_URL_BASE, type CommonTypes } from "../index.ts";
Deno.test({
  name: "Features /collections tests",
  async fn(t) {
    const res = await fetch(`${TEST_URL_BASE}/features/collections`);
    await t.step({
      name: "Successful request",
      fn() {
        expect(res.status).toBe(200);
      },
    });
    await t.step({
      ignore:
        res.status !== 200 &&
        res.headers.get("content-type") === "application/json",
      name: "Request body checks",
      async fn(t) {
        const { collections }: CommonTypes.Collections = await res.json();
        await t.step({
          name: "Response body has a collections member",
          fn() {
            expect(collections).toBeDefined();
            expect(collections).toBeInstanceOf(Array<CommonTypes.Collection>);
          },
        });
        for (const {
          id,
          extent,
          storageCrs,
          links,
          ...others
        } of collections) {
          await t.step({
            name: `Response body at /collections/${id} matches array element`,
            async fn() {
              const res = await fetch(
                `${TEST_URL_BASE}/features/collections/${id}`
              );
              expect(res.status).toBe(200);
              expect(res.headers.get("content-type")).toBe("application/json");
              expect(await res.json()).toMatchObject({
                ...others,
                id,
                extent,
                storageCrs,
              });
            },
          });
          //Extent
          await t.step({
            name: "Extent checks",
            async fn(t) {
              await t.step({
                name: "Spatial checks",
                fn() {
                  expect(extent.spatial.bbox).toBeInstanceOf(
                    Array<Array<CommonTypes.Bbox>>
                  );
                  //Maybe checks for bbox[1] encompassing other bboxs
                  expect(typeof extent.spatial.crs).toBe("string");
                },
              });

              await t.step({
                name: "Temporal Checks",
                fn() {
                  expect(extent.temporal.interval).toBeInstanceOf(
                    Array<[string | null, string | null]>
                  );
                  expect(typeof extent.temporal.trs).toBe("string");
                },
              });
            },
          });

          await t.step({
            name: "Items accepts listed crs,provides correct content-type,content-crs headers",
            async fn(t) {
              let i = 0;
              for (const crs of others.crs) {
                const url = new URL(
                  `${TEST_URL_BASE}/features/collections/${id}/items`
                );
                if (i) url.searchParams.set("crs", crs);
                const res = await fetch(url);
                await t.step({
                  //ignore: !!i,
                  name: "Correct content-crs header value",
                  fn() {
                    expect(res.headers.get("content-crs")).toBe(
                      !i
                        ? "<http://www.opengis.net/def/crs/OGC/1.3/CRS84>"
                        : `<${crs}>`
                    );
                  },
                });
                await t.step({
                  name: "Correct content-type header value",
                  fn() {
                    expect(res.headers.get("content-type")).toBe(
                      "application/geo+json"
                    );
                  },
                });

                //await res.body?.cancel();
                await t.step({
                  name: "GeoJSON response body checks",
                  async fn(t) {
                    const body = await res.json();
                    expect(body.type).toBe("FeatureCollection");
                    expect(body.timeStamp).toBeDefined();
                    expect(body.features).toBeInstanceOf(
                      Array<{
                        type: "Feature";
                        id: string | number;
                        geometry: GeoJSON.Geometry;
                        properties: { [x: string]: any };
                      }>
                    );
                    await t.step({
                      ignore: !body.links,
                      name: "links in featurecollection",
                      async fn() {
                        //let _i = 0;
                        expect(body.links.map((l) => l.rel)).toContain("data");
                        for (const { href, type } of body.links) {
                          const res = await fetch(href);
                          expect(res.status).toBe(200);
                          expect(res.headers.get("content-type")).toBe(type);
                          await res.body?.cancel();
                        }
                      },
                    });
                  },
                });
                i += 1;
              }
            },
          });
        }
      },
    });
  },
});
