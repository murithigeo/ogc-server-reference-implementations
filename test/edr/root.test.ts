//import { describe, expect, test } from "vitest";
import { expect } from "@std/expect";
import { contenttypes, TEST_URL_BASE } from "../index.ts";


Deno.test({
  name: `Edr :root/ tests`,
  async fn(t) {
    let res: Response = await fetch(TEST_URL_BASE + '/edr/');
    let doc: EdrTypes.RootDocument = await res.json()
    await t.step({
      name: `Response checks`,
      async fn(t) {
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type"), "content-type should be application/json").toBe(contenttypes.json);
      },
    })

    await t.step({
      ignore: !res.ok,
      name: "Links Tests",
      async fn(t) {
        await t.step({
          name: `links array contains link objects with rel as data,service-desc,service-doc,conformance`,
          async fn() {
            expect(doc.links).toEqual(expect.arrayContaining([
              expect.objectContaining({ rel: "data" }),
              expect.objectContaining({ rel: "service-desc" }),
              expect.objectContaining({ rel: "service-doc" }),
              expect.objectContaining({ rel: "conformance" })
            ]))
          }
        })
        await t.step({
          name: `all link objects have parseable urls resolving to a valid document`,
          async fn(t) {
            for (const { href, type } of doc.links) {
              res = await fetch(href);
              expect(res.status).toBe(200);
              expect(res.headers.get("content-type")).toBe(type);
              await res.body?.cancel()
            }
          },
        })
      },
    })

    await t.step({
      ignore: doc.provider === undefined,
      name: "Provider checks",
      async fn() {
        expect(URL.canParse(doc.provider?.url!)).toBeTruthy();
        expect(typeof doc.provider?.name).toBe("string")
      }
    })

    await t.step({
      ignore: doc.contact === undefined,
      name: "contact",
      async fn(t) {
        await t.step({
          ignore: doc.contact?.email === undefined,
          name: "email", fn() {
            expect(URL.canParse(("https://" + doc.contact!.email!.split("@")[1]))).toBeTruthy();
          }
        })
        await t.step({
          ignore: true,
          name: "phone number",
          fn() {

          }
        })
      },
    })
  }
})