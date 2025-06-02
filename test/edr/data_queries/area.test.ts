import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "../.."
import { expect } from "@std/expect"
let { collections }: { collections: EdrTypes.Collections["collections"] } = await (await fetch(`${TEST_URL_BASE}/edr/collections`)).json()

let colls: EdrTypes.Collection[] = [...collections];
for (const coll of collections) {
    if (!coll.data_queries.instances) continue;
    let res = await fetch(coll.data_queries.instances.link.href);
    if (!res.ok) continue;
    let { instances }: EdrTypes.Instances = await res.json();
    colls.push(...instances.slice(0, MAX_COLLECTIONS_INSTANCES))
}
for (const c of colls) {
    Deno.test({

        name: `AREA ${c.id} TEST`, async fn(t) {
            const { href, variables: { output_formats = c.output_formats, crs_details = c.crs.map(crs => ({ crs, wkt: "" })) } } = c.data_queries.area?.link!

            let res: Response;
            const uri = new URL(href);
            await t.step({
                name: `Missing/Invalid parameters`,
                async fn(t) {
                    await t.step({
                        name: "Missing coords",
                        async fn(t) {
                            res = await fetch(uri);
                            expect(res.status).toBe(400);
                            await res.body?.cancel()
                        },
                    })
                    await t.step({
                        name: "Invalid coords",
                        async fn(t) {
                            uri.searchParams.set("coords", "P");
                            res = await fetch(uri);
                            expect(res.status).toBe(400);
                            await res.body?.cancel()
                        },
                    });

                    await t.step({
                        name: "Point as coords",
                        async fn(t) {
                            uri.searchParams.set("coords", "POINT(36 1)")
                            res = await fetch(uri);
                            expect(res.status).toBe(400);
                            await res.body?.cancel()
                        },
                    }
                    )

                },
            })
            uri.searchParams.set(`coords`, `Polygon((-180 -90,-180 90,180 90,180 -90,-180 -90))`)
            await t.step({
                name: `Output Formats`, async fn(t) {
                    for (const of of output_formats) {
                        uri.searchParams.set("f", of)
                        const res = await fetch(uri);
                        expect(res.status).toBe(200);
                        await res.body?.cancel();
                    }
                },
            })

            await t.step({
                name: "crs_details test",
                async fn(t) {
                    for (const { crs } of crs_details) {
                        uri.searchParams.set("crs", crs);
                        const res = await fetch(uri);
                        expect(res.status).toBe(200);
                        await res.body?.cancel()
                    }
                },
            })
        },
        ignore: !c.data_queries.area
    })
}