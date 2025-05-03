import { expect } from "@std/expect";
import { TEST_URL_BASE, type CommonTypes } from "../index.ts";

Deno.test({
  name: "Features / tests",
  async fn(t) {
    //Test all links are valid
    const _res = await fetch(new URL(`${TEST_URL_BASE}/features/`));
    const { links }: CommonTypes.Root = await _res.json();
    await t.step({
      name: "Successful request",
      fn() {
        expect(_res.status).toBe(200);
      },
    });
    await t.step({
      name: "Request body includes link array",
      fn() {
        expect(links).toBeDefined();
      },
    });
    await t.step({
      ignore: !links,
      name: "links in link array are valid and reply with 200",
      async fn(t) {
        for (const { href, type } of links) {
          const _res = await fetch(href);
          expect(_res.status).toBe(200);
          expect(_res.headers.get("content-type")).toBe(type);
          await _res.body?.cancel();
        }
      },
    });
    //await _res.body?.cancel();
  },
});
