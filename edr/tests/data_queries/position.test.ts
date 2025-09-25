import { expect } from "@std/expect";
import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE,  } from "../index.test.ts";

let res = await fetch(TEST_URL_BASE + '/edr/collections')
const { collections }= await res.json();
const colls = [...collections];
for (const { data_queries: { instances } } of collections) {
  if (instances) {
    res = await fetch(instances.link.href);
    const { instances: i } = await res.json();
    colls.push(...i.slice(0, MAX_COLLECTIONS_INSTANCES))
  }
}

Deno.test({
  name: `:root/collections/:collectionId/[:instances/:instanceId]/position`,
  async fn(t) {
    for (const { id, data_queries: { position } } of colls) {
      if (!position) continue;
      const { link: { href } } = position!;
      const url = new URL(href)
      await t.step({
        name: `Collection: ${id} `,
        async fn(t) {
          await t.step({
            name: "Missing coords", async fn() {
              res = await fetch(url);
              expect(res.status).toBe(400)
              await res.body?.cancel()
            },
          });
          await t.step({
            name: "Multipoint and POINT",
            async fn() {
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
            name: "Incorrect coords", async fn() {
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
