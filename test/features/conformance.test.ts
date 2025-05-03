import { expect } from "@std/expect";
import { TEST_URL_BASE } from "../index.ts";

Deno.test({
  name: "Features /conformance tests",
  async fn(t) {
    const _res = await fetch(`${TEST_URL_BASE}/features/conformance`);
    const _body = await _res.json();

    await t.step({
      name: "Response successful",
       fn() {
        expect(_res.status).toBe(200);
      },
    });
    await t.step({
      name: "response body has conformsTo array",
      fn() {
        //expect(_body.conformsTo).toBeDefined();
        expect(_body.conformsTo).toBeInstanceOf(Array<string>);
      },
    });
    await t.step({
      ignore: !_body.links,
      name: "links array tests",
      async fn() {
        for (const { href, type } of _body.links) {
          const res = await fetch(href);
          expect(res.status).toBe(200);
          expect(res.headers.get("content-type")).toBe(type);
          await res.body?.cancel();
        }
      },
    });
  },
});
