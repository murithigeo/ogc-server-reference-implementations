import { expect } from "@std/expect";
import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "../..";

const { collections }: EdrTypes.Collections = await (await fetch(`${TEST_URL_BASE}/edr/collections`)).json();


let colls = [...collections];
for (const { data_queries } of collections) {
    if (data_queries.instances) {
        const { instances }: EdrTypes.Instances = await (await fetch(data_queries.instances.link.href)).json()
        colls.push(...instances.slice(0, MAX_COLLECTIONS_INSTANCES))
    }
}

for (const { id, data_queries: { cube } } of colls) {
    const { link: { href, } } = cube!
    Deno.test({
        name: `${id} CUBE tests`,
        ignore: !cube,
        async fn(t) {
            let res: Response;
            const url = new URL(href);

            await t.step({
                name: `Missing bbox parameter`,
                async fn() {
                    res = await fetch(url);
                    expect(res.status).toBe(400);
                    await res.body?.cancel()
                }
            })

            await t.step({
                name: `Incorrect bbox value`,
                async fn() {
                    url.searchParams.set("bbox", "-180,-90,180,90,0");
                    res = await fetch(url);
                    expect(res.status, "bbox length is 5").toBe(400);
                    await res.body?.cancel();

                    url.searchParams.set("bbox", "-180,-90,180");
                    res = await fetch(url);
                    expect(res.status, "bbox length is 3").toBe(400)
                    res.body?.cancel()
                }
            })

            await t.step({
                name: "Correct values",
                async fn() {
                    url.searchParams.set("bbox", "-180,-90,180,90");
                    res = await fetch(url);
                    expect(res.status, "bbox length is 4").toBe(200)
                    await res.body?.cancel()

                    url.searchParams.set("bbox", "-180,-90,0,180,90,1000");
                    res = await fetch(url)
                    expect(res.status, "bbox length is 6").toBe(200);
                    await res.body?.cancel()
                }
            })
        }
    })
}