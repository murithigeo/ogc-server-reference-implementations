import { expect } from "@std/expect";
import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "../../index";

let res = await fetch(TEST_URL_BASE + '/edr/collections')
const { collections }: EdrTypes.Collections = await res.json();
let colls = [...collections];
for (const { data_queries: { instances } } of collections) {
    if (instances) {
        res = await fetch(instances.link.href);
        let { instances: i }: EdrTypes.Instances = await res.json();
        colls.push(...i.slice(0, MAX_COLLECTIONS_INSTANCES))
    }
}

Deno.test({
    name: ":root/collections/:collectionId/[instances/:instanceId]/radius", async fn(t) {
        for (const { id, data_queries: { radius } } of colls) {
            let { link: { href, variables } } = radius!
            let url = new URL(href);
            await t.step({
                ignore: radius === undefined,
                name: "Missing within", async fn(t) {
                    url.searchParams.set("within-units", variables.within_units[0]);
                    url.searchParams.set("coords", "POINT(36 1)");
                    res = await fetch(url);
                    expect(res.status).toBe(400);
                    await res.body?.cancel()
                },
            })

            await t.step({
                ignore: radius === undefined,
                name: "Missing within-units", async fn(t) {
                    url.searchParams.delete("within-units");
                    url.searchParams.set("within", "1000");
                    res = await fetch(url);
                    expect(res.status).toBe(400)
                    await res.body?.cancel()
                },
            })

            await t.step({
                ignore: radius === undefined,
                name: "coords", async fn(t) {
                    await t.step({
                        name: "Missing/Incorrect coords", async fn(t) {
                            url.searchParams.delete("coords");
                            url.searchParams.set("within-units", variables.within_units[0]);
                            res = await fetch(url);
                            expect(res.status).toBe(400);
                            await res.body?.cancel()
                        },
                    })

                    await t.step({
                        name: "Multipoint and point", async fn(t) {
                            url.searchParams.set("coords", "MULTIPOINT(36 1, 40 1)");
                            url.searchParams.set("within-units", variables.within_units[0]);
                            res = await fetch(url);
                            expect(res.status).toBe(200);
                            await res.body?.cancel()

                            url.searchParams.set("coords", "POINT(36 1)");
                            res = await fetch(url);
                            expect(res.status).toBe(200);
                            await res.body?.cancel()
                        },
                    })
                },
            })
        }
    }
})