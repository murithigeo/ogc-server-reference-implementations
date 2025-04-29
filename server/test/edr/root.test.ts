//import { describe, expect, test } from "vitest";
import { expect } from "@std/expect";
import { contenttypes } from "../index.ts";

Deno.test({
  name: "Edr / tests",
  async fn(t) {
    const res = await fetch(`http://localhost/edr/`);
    const body = await res.json();
    await t.step({
      name: "Successful request",
      fn() {
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toBe(contenttypes.json);
      },
    });
    await t.step({
      ignore: !body.links,
      name: "links check",
      async fn() {
        for (const { href, type } of body.links) {
          const _res = await fetch(href);
          expect(_res.status).toBe(200);
          expect(_res.headers.get("content-type")).toBe(type);
          _res.body?.cancel();
        }
      },
    });
    expect(typeof body.title).toBe("string");
    expect(typeof body.description).toBe("string");
    await t.step({
      ignore: !body.provider,
      name: "Provider check",
      fn() {
        expect(typeof body.provider.name).toBe("string");
        expect(URL.canParse(body.provider.url)).toBeTruthy;
      },
    });
    await t.step({
      name: "contact checks",
      fn() {
        //Add checks for undefined
        expect(typeof body.contact.email).toBe("string");
      },
    });
    //Title
    //Description
    //provider
    //contact
    //links
    await t.step({
      ignore: !body.links,
      name: "Links Checks",
      async fn() {
        expect(body.links).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ rel: "conformance" }),
            expect.objectContaining({ rel: "service-desc" }),
            expect.objectContaining({ rel: "service-doc" }),
            expect.objectContaining({ rel: "data" }),
          ])
        );
        for (const { href, type } of body.links) {
          const _res = await fetch(href);
          expect(_res.status).toBe(200);
          expect(_res.headers.get("content-type")).toBe(type);
          _res.body?.cancel();
        }
      },
    });
  },
});
