import { expect } from "@std/expect";
import { contenttypes, MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "../../index.ts"

const { collections }: EdrTypes.Collections = await (await fetch(`${TEST_URL_BASE}/edr/collections`)).json();


let colls = [...collections];
for (const { data_queries } of collections) {
    if (data_queries.instances) {
        const { instances }: EdrTypes.Instances = await (await fetch(data_queries.instances.link.href)).json()
        colls.push(...instances.slice(0, MAX_COLLECTIONS_INSTANCES))
    }
}

Deno.test({
    name: `Location Tests`,
    async fn(t) {
        for (const { id, data_queries: { locations } } of colls) {
            await t.step({
                name: `Collection: ${id}`, async fn(t) {
                    const { link: { href, variables } } = locations!
                    let url: URL;
                    let res: Response
                    let locationIds: (string | number)[]

                    url = new URL(href);
                    res = await fetch(url);
                    expect(res.status).toBe(200);
                    expect([contenttypes.geojson, contenttypes.json]).toContain(res.headers.get("content-type"));
                    locationIds = (await res.json()).features.map(r => r.id)

                    await t.step({
                        //ignore: !variables.multi && !locationIds.length,
                        name: `Non-multi and Multi- tests`,
                        async fn(t) {
                            await t.step({
                                name: `Correct values`,
                                async fn() {
                                    let locString = variables.multi ? locationIds.slice(0, 5).join(",") : locationIds[0];
                                    res = await fetch(`${href}/${locString}`);
                                    expect(res.headers.get("content-type")).not.toBe(null);
                                    expect(res.status).toBe(200);
                                    await res.body?.cancel()
                                }
                            })
                            await t.step({
                                name: `Includes incorrect values`,
                                async fn() {
                                    let locString = variables.multi ? locationIds.slice(0, 5).concat("100000000").join(",") : locationIds[0] + '1000000';
                                    res = await fetch(`${href}/${locString}`);
                                    expect(res.status).toBe(404)
                                    await res.body?.cancel()
                                }
                            })

                        },
                    });

                    await t.step({
                        name: `bbox & datetime tests`,
                        async fn(t) {
                            
                        },
                    })
                },
            })
        }
    }
})