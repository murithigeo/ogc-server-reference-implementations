import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "../index.test.ts"
import { expect } from "@std/expect";
const { collections } = await (await fetch(`${TEST_URL_BASE}/edr/collections`)).json()

const colls = [...collections];
for (const coll of collections) {
    if (!coll.data_queries.instances) continue;
    const res = await fetch(coll.data_queries.instances.link.href);
    if (!res.ok) continue;
    const { instances }= await res.json();
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
                        async fn() {
                            res = await fetch(uri);
                            expect(res.status).toBe(400);
                            await res.body?.cancel()
                        },
                    })
                    await t.step({
                        name: "Invalid coords",
                        async fn() {
                            uri.searchParams.set("coords", "P");
                            res = await fetch(uri);
                            expect(res.status).toBe(400);
                            await res.body?.cancel()
                        },
                    });

                    await t.step({
                        name: "Point as coords",
                        async fn() {
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
                name: `Output Formats`, async fn() {
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
                async fn() {
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