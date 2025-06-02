import { expect } from "@std/expect";
import { TEST_URL_BASE, type CommonTypes } from "../index.ts";

const { collections }: CommonTypes.Collections = await (await fetch(`${TEST_URL_BASE}/features/collections`)).json();

Deno.test({
  name: "Features API: Comprehensive /collections based tests",
  async fn(t) {
    let res: Response;
    for (const { id, crs, extent, links, ...r } of collections) {
      await t.step({
        name: `object matches the one at /collections/:id`,
        async fn(t) {
          res = await fetch(`${TEST_URL_BASE}/features/collections/${id}`);
          expect(res.status).toBe(200);
          //Exclude links because they are different contigent on path
          expect(await res.json()).toMatchObject({ ...r, id, crs, extent })
        },
      })
      await t.step({
        name: "crs", fn(t) {
          expect(crs[0]).toBe("http://www.opengis.net/def/crs/OGC/1.3/CRS84")
        },
      })

      await t.step({
        name: "links",
        async fn(t) {
          expect(links).toEqual(expect.arrayContaining([expect.objectContaining({ href: `${TEST_URL_BASE}/features/collections/${id}/items`, rel: "items", type: "application/geo+json", }),
            /*
                expect.objectContaining({
                href:`${TEST_URL_BASE}/features/collections/${id}`,
                rel:"data",
                type:"application/json"
              })
                */
          ]))

        },
      })
    }
  }
})