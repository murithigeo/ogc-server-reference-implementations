import { expect } from "@std/expect";
import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "../index";

const { collections }: EdrTypes.Collections = await (await fetch(`${TEST_URL_BASE}/edr/collections`)).json()

let colls = [...collections];
for (const { data_queries } of collections) {
    if (data_queries.instances) {
        const { instances }: EdrTypes.Instances = await (await fetch(data_queries.instances.link.href)).json()
        colls.push(...instances.slice(0, MAX_COLLECTIONS_INSTANCES))
    }
}

Deno.test({
    name: `Collection/Instance Extent Checks`,
    async fn(t) {
        for (const { id, extent: { spatial, temporal, vertical } } of colls) {
            await t.step({
                ignore: !vertical,
                name: `Collection: ${id} Vertical`,
                async fn(t) {
                    await t.step({
                        ignore: !vertical,
                        name: `values`,
                        fn() {
                            vertical?.values?.every(v => {
                                expect(typeof v).toBe("string");
                                //expect(parseFloat(v)).not.toBeNaN()
                                if (v.includes("/")) {
                                    (v.startsWith("R") ? v.substring(1) : v).split("/").every(p => expect(parseFloat(p)).not.toBeNaN())
                                }
                            })
                        },
                    })
                    await t.step({
                        name: "Interval. Tests only first array. Skips if element is null",
                        async fn(t) {
                            expect(vertical?.interval[0].length).toBe(2);
                            await t.step({
                                ignore: vertical?.interval[0][0] === null,
                                name: `First value is string`, async fn() {
                                    expect(parseFloat(vertical?.interval[0][0]!)).not.toBeNaN()
                                }
                            })
                            await t.step({
                                ignore: vertical?.interval[0][1] === null,
                                name: `Second value is string`,
                                fn() {
                                    expect(parseFloat(vertical?.interval[0][1]!)).not.toBeNaN()
                                }
                            })
                        },
                    })

                    await t.step({
                        ignore: vertical?.vrs === undefined, name: "vrs", async fn(t) {
                            expect(typeof vertical?.vrs).toBe("string")
                        },
                    })
                    await t.step({
                        ignore: vertical?.name === undefined, name: "vrs", async fn(t) {
                            expect(URL.canParse(vertical?.vrs!)).toBe(true)
                        },
                    })
                    //await t.step({                    })
                },
            })
            await t.step({
                name: `Collection: ${id} Temporal`,
                async fn(t) {
                    await t.step({
                        ignore: temporal.interval[0][0] === null && temporal.interval[0][0] === null,
                        name: "interval", async fn(t) {
                            await t.step({
                                name: "First value", async fn() {
                                    expect(typeof Date.parse(temporal.interval[0][0]!)).toBe("number")
                                }
                            });
                            await t.step({
                                name: "Second value", async fn() {
                                    expect(typeof Date.parse(temporal.interval[0][1]!)).toBe("number")
                                }
                            });
                        },
                    })

                    await t.step({
                        ignore: temporal.values === undefined, name: "values", async fn(t) {
                            (temporal.values?.every(v => expect(typeof v).toBe("string")))
                        },
                    })
                },
            })
            await t.step({
                name: `Collection: ${id} Spatial`,
                async fn(t) {
                    await t.step({
                        name: "Bbox: Tests only first array", async fn(t) {
                            await t.step({
                                ignore: spatial.bbox[0].length === 6,
                                name: "Four-Item",
                                async fn() {
                                    expect(spatial.bbox[0][0]).toBeLessThanOrEqual(spatial.bbox[0][2])
                                    expect(spatial.bbox[0][1]).toBeLessThanOrEqual(spatial.bbox[0][3])
                                }
                            })
                            await t.step({
                                ignore: spatial.bbox[0].length === 4,
                                name: "Six-Item",
                                async fn() {
                                    expect(spatial.bbox[0][0]).toBeLessThanOrEqual(spatial.bbox[0][3])
                                    expect(spatial.bbox[0][1]).toBeLessThanOrEqual(spatial.bbox[0][4])
                                    expect(spatial.bbox[0][2], "Lower axis height value").toBeLessThanOrEqual(spatial.bbox[0][5])

                                }
                            })
                        },
                    })
                    await t.step({
                        name: "crs", async fn(t) {
                            expect(URL.canParse(spatial.crs)).toBeTruthy()
                        },
                    })
                    await t.step({
                        ignore: spatial.name === undefined,
                        name: "name", async fn(t) {
                            expect(URL.canParse(spatial.name!)).toBeTruthy()
                        },
                    })
                },
            })
        }
    }
})