import { expect } from "@std/expect";
import { TEST_URL_BASE } from "../index";

Deno.test({
    name: ":root/conformance tests",
    async fn(t) {
        let res = await fetch(TEST_URL_BASE + '/edr/conformance');
        let doc: CommonTypes.ConformanceDocument = await res.json();
        await t.step({
            name: "conformance classes: Does not test actual conformance",
            async fn(t) {
                doc.conformsTo.every(li => {
                    expect(URL.canParse(li)).toBeTruthy();
                })
            },
        })
        await t.step({
            ignore: doc.links === undefined,
            name: "links",
            async fn(t) {
                for (const { href, type } of doc.links!) {
                    res = await fetch(href);
                    expect(res.status).toBe(200);
                    expect(res.headers.get("content-type")).toBe(type)
                    await res.body?.cancel()
                }
            },
        })
    }
})
