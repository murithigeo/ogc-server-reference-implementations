import { expect } from "@std/expect";
import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE, type EdrTypes } from "../../index.ts";

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
  name: `:root/collections/:collectionId/[:instances/:instanceId]/position`,
  async fn(t) {
    for (const { id, data_queries: { position } } of colls) {
      let { link: { href } } = position!;
      let url = new URL(href)
      await t.step({
        name: `Collection: ${id} `,
        async fn(t) {
          await t.step({
            name: "Missing coords", async fn(t) {
              res = await fetch(url);
              expect(res.status).toBe(400)
              await res.body?.cancel()
            },
          });
          await t.step({
            name: "Multipoint and POINT",
            async fn(t) {
              url.searchParams.set("coords", "MULTIPOINT(40 1,36 1)");
              res = await fetch(url);
              expect(res.status).toBe(200);
              await res.body?.cancel();

              url.searchParams.set("coords", "POINT(36 1)");
              res = await fetch(url);
              expect(res.status).toBe(200);
              await res.body?.cancel();
            }
          })

          await t.step({
            name: "Incorrect coords", async fn(t) {
              url.searchParams.set("coords", "LINESTRING(36 1, 37 1)");
              res = await fetch(url);
              expect(res.status).toBe(400);
              await res.body?.cancel();

              url.searchParams.set("coords", "POINT(37, 1)");
              res = await fetch(url);
              expect(res.status).toBe(200);
              await res.body?.cancel();
            }
          })

        },
      })
    }
  }
});
