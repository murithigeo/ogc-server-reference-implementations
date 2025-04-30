//import {  describe, expect, test } from "vitest";
import { contenttypes, type EdrTypes } from "../index.ts";
import { expect } from "@std/expect";

const _res0 = await fetch(`http://localhost/edr/collections`);
const { collections } = await _res0.json();

for (const c of collections) {
  Deno.test({
    name: `collection in array matches one at /collections/${c.id}`,
    async fn() {
      const _res1 = await fetch(`http://localhost/edr/collections/${c.id}`);
      expect(_res1.status).toBe(200);
      expect(_res1.headers.get("content-type")).toBe("application/json");
      expect(await _res1.json()).toMatchObject(c);
    },
  });
}
Deno.test({
  name: "edr /collections tests",
  async fn(t) {
    //Move this to individual test suite
    await t.step({
      name: "Successful request",
      fn() {
        expect(_res0.status).toBe(200);
        expect(_res0.headers.get("content-type")).toBe(contenttypes.json);
      },
    });

    await t.step({
      name: "Collections member is an array",
      fn() {
        expect(Array.isArray(collections)).toBeTruthy();
      },
    });
  },
});

for (const {
  id,
  data_queries,
  extent,
  ...others
} of collections as EdrTypes.Collection[]) {
  Deno.test({
    name: "Main tests",
    async fn(t) {
      await t.step({
        name: "extent tests",
        async fn(t) {
          await t.step({
            name: "Spatial checks",
            fn() {
              expect(
                extent.spatial.bbox.every(
                  (d) =>
                    Array.isArray(d) && d.every((d0) => typeof d0 === "number")
                )
              ).toBeTruthy();
              expect(typeof extent.spatial.crs).toBe("string");
              //expect(typeof extent.spatial.name)
            },
          });
          await t.step({
            name: "Temporal checks",
            async fn(t) {
              expect(Array.isArray(extent.temporal.interval)).toBeTruthy();
              expect(
                extent.temporal.interval.every(
                  (i) =>
                    Array.isArray(i) &&
                    i.every((i0) => typeof i0 === "string" || i0 === null)
                )
              ).toBeTruthy();
              await t.step({
                name: "values check",
                fn() {
                  expect(
                    extent.temporal.values?.every((v) => typeof v === "string")
                  ).toBeTruthy();
                },
              });
            },
          });
        },
      });

      await t.step({
        name: "crs array checks",
        fn() {
          expect(Array.isArray(others.crs)).toBeTruthy();
        },
      });
      await t.step({
        name: "output_formats array checks",
        fn() {
          expect(Array.isArray(others.output_formats)).toBeTruthy();
        },
      });
      await t.step({
        name: "keywords array checks",
        ignore: !others.keywords,
        fn() {
          //expect(Array.isArray(others.keywords)).toBeTruthy();
          expect(
            others.keywords?.every((kw) => typeof kw === "string")
          ).toBeTruthy();
        },
      });
    },
  });
  Deno.test({
    ignore: !data_queries.position,
    name: `collection: ${id} POSITION Tests`,
    async fn(t) {
      const {
        link: {
          href,
          variables: { crs_details, output_formats, default_output_format },
        },
      } = data_queries?.position!;
      const url = new URL(href);
      url.searchParams.set("coords", "Point(36 1)");
      //Do without crs first
      //Do without default output_format

      await t.step({
        name: "crs_details test + default_output_format(f not set) but expected",
        async fn() {
          for (const { crs } of crs_details) {
            url.searchParams.set("crs", crs);
            const crs_res = await fetch(url);
            crs_res.body?.cancel();
            expect(crs_res.status).toBe(200);
            expect(Object.fromEntries(crs_res.headers.entries())).toEqual(
              expect.objectContaining({
                "content-type":
                  contenttypes[default_output_format.toLowerCase()],
                "content-crs": `<${crs}>`,
              })
            );
          }
        },
      });
      await t.step({
        name: "output_formats check",
        async fn() {
          for (const f of output_formats) {
            const _purl = new URL(url);
            _purl.searchParams.set("f", f);
            const _res = await fetch(_purl);
            _res.body?.cancel();
            expect(_res.status).toBe(200);
            expect(_res.headers.get("content-type")).toBe(
              contenttypes[f.toLowerCase()]
            );
          }
        },
      });

      await t.step({
        name: "datetime param check",
        ///Need a way to verify the bounds of responses
        async fn() {},
      });
    },
  });

  Deno.test({
    ignore: !data_queries.corridor,
    name: `edr CORRIDOR data query tests`,
    async fn(t) {
      const {
        href,
        variables: { default_output_format, output_formats, ...others },
      } = data_queries.corridor!.link;
      const url0 = new URL(href);
      url0.searchParams.set("corridor-width", `1`);
      url0.searchParams.set("corridor-height", `1`);
      url0.searchParams.set(
        "coords",
        `LINESTRINGZM(36 0 0 ${new Date().getTime()}, 37 0 1000 ${
          new Date().getTime() - 10000
        }, 38 0 2000 ${new Date().getTime() - 20000},39 0 3000 ${
          new Date().getTime() - 300000
        })`
      );

      await t.step({
        name: "height-units test",
        async fn() {
          const url1 = new URL(url0);
          url1.searchParams.set("width-units", others.width_units[0]);
          for (const height_unit of others.height_units) {
            url1.searchParams.set("height-units", height_unit);
            const res = await fetch(url1);
            await res.body?.cancel();
            expect(res.status).toBe(200);
            //            expect()
          }
        },
      });
      await t.step({
        name: "width-units tests",
        async fn() {
          const url1 = new URL(url0);
          url1.searchParams.set("height-units", others.height_units[0]);
          for (const width_unit of others.width_units) {
            url1.searchParams.set("width-units", width_unit);
            const res = await fetch(url1);
            await res.body?.cancel();
            expect(res.status).toBe(200);
          }
        },
      });
      await t.step({
        name: "crs_details + default_output_format",
        async fn() {
          for (const { crs } of others.crs_details) {
            const url1 = new URL(url0);
            url1.searchParams.set("crs", crs);
            url1.searchParams.set("height-units", others.height_units[0]);
            url1.searchParams.set("width-units", others.width_units[0]);

            const res = await fetch(url1);
            await res.body?.cancel();
            expect(res.status).toBe(200);
            expect(Object.fromEntries(res.headers.entries())).toEqual(
              expect.objectContaining({
                "content-type":
                  contenttypes[default_output_format.toLowerCase()],
                "content-crs": `<${crs}>`,
              })
            );
          }
        },
      });

      await t.step({
        name: "output_formats checks",
        async fn() {
          const url1 = new URL(url0);
          url1.searchParams.set("height-units", others.height_units[0]);
          url1.searchParams.set("width-units", others.width_units[0]);
          for (const f of output_formats) {
            url1.searchParams.set("f", f);
            const res = await fetch(url1);
            await res.body?.cancel();
            expect(res.status).toBe(200);
            expect(res.headers.get("content-type")).toBe(
              contenttypes[f.toLowerCase()]
            );
          }
        },
      });
      await t.step({
        name: "[geometry]ZM geometry + datetime",
        async fn() {
          const url1 = new URL(url0);
          url1.searchParams.set("datetime", new Date().toISOString());
          const res = await fetch(url1);
          await res.body?.cancel();
          expect(res.status).toBe(400);
        },
      });
      await t.step({
        name: "[geometry]ZM +z",
        async fn() {
          const url1 = new URL(url0);
          url1.searchParams.set("z", "10/20");
          const res = await fetch(url1);
          await res.body?.cancel();
          expect(res.status).toBe(400);
        },
      });
    },
  });

  Deno.test({
    ignore: !data_queries.locations,
    name: `Collection: ${id} LOCATIONS tests`,
    async fn(t) {
      //Without bbox
      const {
        link: {
          href,
          variables: { default_output_format, output_formats },
        },
      } = data_queries.locations!;
      const url0 = new URL(href);
      await t.step({
        name: `Without bbox + default_output_format`,
        async fn() {
          const url1 = new URL(url0);
          const res = await fetch(url1);
          await res.body?.cancel();
          expect(res.status).toBe(200);
          expect(res.headers.get("content-type")).toBe(
            contenttypes[default_output_format.toLowerCase()]
          );
          //expect(res.headers.get("content-crs")).toBe()
        },
      });
      await t.step({
        name: "with bbox",
        async fn(t) {
          const url1 = new URL(url0);
          await t.step({
            name: "4-item",
            async fn() {
              url1.searchParams.set("bbox", "-180,-90,180,90");
              const res = await fetch(url1);
              await res.body?.cancel();
              expect(res.status).toBe(200);
            },
          });
          await t.step({
            name: "6 item",
            async fn() {
              url1.searchParams.set("bbox", "-180,-90,10,180,90,1000");
              const res = await fetch(url1);
              await res.body?.cancel();
              expect(res.status).toBe(200);
            },
          });
        },
      });
      await t.step({
        name: "output_formats",
        async fn() {
          const url1 = new URL(url0);
          for (const f of output_formats) {
            url1.searchParams.set("f", f);
            const res = await fetch(url1);
            await res.body?.cancel();
            expect(res.status).toBe(200);
            expect(res.headers.get("content-type")).toBe(
              contenttypes[f.toLowerCase()]
            );
          }
        },
      });
    },
  });
}

const maxInstances = 10;
//Instances
for (const {
  data_queries: { instances },
  id: cId,
} of collections as EdrTypes.Collection[]) {
  Deno.test({
    ignore: !instances,
    name: `Collection: ${cId} INSTANCES: Data Query checks`,
    async fn(t) {
      const {
        link: {
          href,
          variables: { output_formats, default_output_format },
        },
      } = instances!;
      const url1 = new URL(href);
      const res1 = await fetch(url1);
      const { instances: _instances } = await res1.json();
      await t.step({
        name: `Request successful + appropriate content-type`,
        fn() {
          expect(res1.status).toBe(200);
          expect(res1.headers.get("content-type")).toBe("application/json");
        },
      });
      await t.step({
        name: "output_formats checks",
        async fn() {
          for (const f of [default_output_format, ...output_formats]) {
            const url2 = new URl(url1);
            url2.searchParams.set("f", f);
            const res2 = await fetch(url2);
            expect(res2.status).toBe(200);
            expect(res2.headers.get("content-type")).toBe(
              contenttypes[f.toLowerCase()]
            );
            await res2.body?.cancel();
          }
        },
      });
      //Loop over the instances
      await t.step({
        name: `Instances loop tests`,
        async fn(t) {
          for (let i = 0; i < maxInstances; i++) {
            const { id, data_queries, extent, ...others }: EdrTypes.Collection =
              _instances[i];
            await t.step({
              name: `instance: ${id} exists on instances path`,
              async fn() {
                const url2 = new URL(url1);
                url2.pathname = `${url2.pathname}/${id}`;
                const res2 = await fetch(url2);
                expect(res2.status).toBe(200);
                expect(res2.headers.get("content-type")).toBe(
                  "application/json"
                );
                expect(await res2.json()).toMatchObject({
                  id,
                  data_queries,
                  extent,
                  ...others,
                });
              },
            });
            await t.step({
              name: "No instances data query exists",
              fn() {
                expect(data_queries.instances).toBeUndefined();
              },
            });
            await t.step({
              name: "Main tests",
              async fn(t) {
                await t.step({
                  name: "extent tests",
                  async fn(t) {
                    await t.step({
                      name: "Spatial checks",
                      fn() {
                        expect(
                          extent.spatial.bbox.every(
                            (d) =>
                              Array.isArray(d) &&
                              d.every((d0) => typeof d0 === "number")
                          )
                        ).toBeTruthy();
                        expect(typeof extent.spatial.crs).toBe("string");
                        //expect(typeof extent.spatial.name)
                      },
                    });
                    await t.step({
                      name: "Temporal checks",
                      async fn(t) {
                        expect(
                          Array.isArray(extent.temporal.interval)
                        ).toBeTruthy();
                        expect(
                          extent.temporal.interval.every(
                            (i) =>
                              Array.isArray(i) &&
                              i.every(
                                (i0) => typeof i0 === "string" || i0 === null
                              )
                          )
                        ).toBeTruthy();
                        await t.step({
                          name: "values check",
                          fn() {
                            expect(
                              extent.temporal.values?.every(
                                (v) => typeof v === "string"
                              )
                            ).toBeTruthy();
                          },
                        });
                      },
                    });
                  },
                });

                await t.step({
                  name: "crs array checks",
                  fn() {
                    expect(Array.isArray(others.crs)).toBeTruthy();
                  },
                });
                await t.step({
                  name: "output_formats array checks",
                  fn() {
                    expect(Array.isArray(others.output_formats)).toBeTruthy();
                  },
                });
                await t.step({
                  name: "keywords array checks",
                  ignore: !others.keywords,
                  fn() {
                    //expect(Array.isArray(others.keywords)).toBeTruthy();
                    expect(
                      others.keywords?.every((kw) => typeof kw === "string")
                    ).toBeTruthy();
                  },
                });
              },
            });
            await t.step({
              ignore: !data_queries.position,
              name: `collection: ${id} POSITION Tests`,
              async fn(t) {
                const {
                  link: {
                    href,
                    variables: {
                      crs_details,
                      output_formats,
                      default_output_format,
                    },
                  },
                } = data_queries?.position!;
                const url = new URL(href);
                url.searchParams.set("coords", "Point(36 1)");
                //Do without crs first
                //Do without default output_format

                await t.step({
                  name: "crs_details test + default_output_format(f not set) but expected",
                  async fn() {
                    for (const { crs } of crs_details) {
                      url.searchParams.set("crs", crs);
                      const crs_res = await fetch(url);
                      crs_res.body?.cancel();
                      expect(crs_res.status).toBe(200);
                      expect(
                        Object.fromEntries(crs_res.headers.entries())
                      ).toEqual(
                        expect.objectContaining({
                          "content-type":
                            contenttypes[default_output_format.toLowerCase()],
                          "content-crs": `<${crs}>`,
                        })
                      );
                    }
                  },
                });
                await t.step({
                  name: "output_formats check",
                  async fn() {
                    for (const f of output_formats) {
                      const _purl = new URL(url);
                      _purl.searchParams.set("f", f);
                      const _res = await fetch(_purl);
                      _res.body?.cancel();
                      expect(_res.status).toBe(200);
                      expect(_res.headers.get("content-type")).toBe(
                        contenttypes[f.toLowerCase()]
                      );
                    }
                  },
                });

                await t.step({
                  name: "datetime param check",
                  ///Need a way to verify the bounds of responses
                  async fn() {},
                });
              },
            });

            await t.step({
              ignore: !data_queries.corridor,
              name: `edr CORRIDOR data query tests`,
              async fn(t) {
                const {
                  href,
                  variables: {
                    default_output_format,
                    output_formats,
                    ...others
                  },
                } = data_queries.corridor!.link;
                const url0 = new URL(href);
                url0.searchParams.set("corridor-width", `1`);
                url0.searchParams.set("corridor-height", `1`);
                url0.searchParams.set(
                  "coords",
                  `LINESTRINGZM(36 0 0 ${new Date().getTime()}, 37 0 1000 ${
                    new Date().getTime() - 10000
                  }, 38 0 2000 ${new Date().getTime() - 20000},39 0 3000 ${
                    new Date().getTime() - 300000
                  })`
                );

                await t.step({
                  name: "height-units test",
                  async fn() {
                    const url1 = new URL(url0);
                    url1.searchParams.set("width-units", others.width_units[0]);
                    for (const height_unit of others.height_units) {
                      url1.searchParams.set("height-units", height_unit);
                      const res = await fetch(url1);
                      await res.body?.cancel();
                      expect(res.status).toBe(200);
                      //            expect()
                    }
                  },
                });
                await t.step({
                  name: "width-units tests",
                  async fn() {
                    const url1 = new URL(url0);
                    url1.searchParams.set(
                      "height-units",
                      others.height_units[0]
                    );
                    for (const width_unit of others.width_units) {
                      url1.searchParams.set("width-units", width_unit);
                      const res = await fetch(url1);
                      await res.body?.cancel();
                      expect(res.status).toBe(200);
                    }
                  },
                });
                await t.step({
                  name: "crs_details + default_output_format",
                  async fn() {
                    for (const { crs } of others.crs_details) {
                      const url1 = new URL(url0);
                      url1.searchParams.set("crs", crs);
                      url1.searchParams.set(
                        "height-units",
                        others.height_units[0]
                      );
                      url1.searchParams.set(
                        "width-units",
                        others.width_units[0]
                      );

                      const res = await fetch(url1);
                      await res.body?.cancel();
                      expect(res.status).toBe(200);
                      expect(Object.fromEntries(res.headers.entries())).toEqual(
                        expect.objectContaining({
                          "content-type":
                            contenttypes[default_output_format.toLowerCase()],
                          "content-crs": `<${crs}>`,
                        })
                      );
                    }
                  },
                });

                await t.step({
                  name: "output_formats checks",
                  async fn() {
                    const url1 = new URL(url0);
                    url1.searchParams.set(
                      "height-units",
                      others.height_units[0]
                    );
                    url1.searchParams.set("width-units", others.width_units[0]);
                    for (const f of output_formats) {
                      url1.searchParams.set("f", f);
                      const res = await fetch(url1);
                      await res.body?.cancel();
                      expect(res.status).toBe(200);
                      expect(res.headers.get("content-type")).toBe(
                        contenttypes[f.toLowerCase()]
                      );
                    }
                  },
                });
                await t.step({
                  name: "[geometry]ZM geometry + datetime",
                  async fn() {
                    const url1 = new URL(url0);
                    url1.searchParams.set("datetime", new Date().toISOString());
                    const res = await fetch(url1);
                    await res.body?.cancel();
                    expect(res.status).toBe(400);
                  },
                });
                await t.step({
                  name: "[geometry]ZM +z",
                  async fn() {
                    const url1 = new URL(url0);
                    url1.searchParams.set("z", "10/20");
                    const res = await fetch(url1);
                    await res.body?.cancel();
                    expect(res.status).toBe(400);
                  },
                });
              },
            });

            await t.step({
              ignore: !data_queries.locations,
              name: `Collection: ${id} LOCATIONS tests`,
              async fn(t) {
                //Without bbox
                const {
                  link: {
                    href,
                    variables: { default_output_format, output_formats },
                  },
                } = data_queries.locations!;
                const url0 = new URL(href);
                await t.step({
                  name: `Without bbox + default_output_format`,
                  async fn() {
                    const url1 = new URL(url0);
                    const res = await fetch(url1);
                    await res.body?.cancel();
                    expect(res.status).toBe(200);
                    expect(res.headers.get("content-type")).toBe(
                      contenttypes[default_output_format.toLowerCase()]
                    );
                    //expect(res.headers.get("content-crs")).toBe()
                  },
                });
                await t.step({
                  name: "with bbox",
                  async fn(t) {
                    const url1 = new URL(url0);
                    await t.step({
                      name: "4-item",
                      async fn() {
                        url1.searchParams.set("bbox", "-180,-90,180,90");
                        const res = await fetch(url1);
                        await res.body?.cancel();
                        expect(res.status).toBe(200);
                      },
                    });
                    await t.step({
                      name: "6 item",
                      async fn() {
                        url1.searchParams.set(
                          "bbox",
                          "-180,-90,10,180,90,1000"
                        );
                        const res = await fetch(url1);
                        await res.body?.cancel();
                        expect(res.status).toBe(200);
                      },
                    });
                  },
                });
                await t.step({
                  name: "output_formats",
                  async fn() {
                    const url1 = new URL(url0);
                    for (const f of output_formats) {
                      url1.searchParams.set("f", f);
                      const res = await fetch(url1);
                      await res.body?.cancel();
                      expect(res.status).toBe(200);
                      expect(res.headers.get("content-type")).toBe(
                        contenttypes[f.toLowerCase()]
                      );
                    }
                  },
                });
              },
            });
          }
        },
      });
    },
  });
}
