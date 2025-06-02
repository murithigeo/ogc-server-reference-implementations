import { expect } from "@std/expect";
import { contenttypes, TEST_URL_BASE } from "../../index.ts";

const { collections }: EdrTypes.Collections = await (await fetch(`${TEST_URL_BASE}/edr/collections`)).json();

Deno.test({
    name: `default_output_format + output_format tests`, async fn(t) {

        for (const { id, data_queries, output_formats } of collections) {
            //Object.entries(data_queries).forEach(async ([k, v]: [keyof EdrTypes.DataQueries, EdrTypes.DataQueries[keyof EdrTypes.DataQueries]]) => {
            for (const k of Object.keys(data_queries)) {

                let res: Response;
                const { link: { href, variables, } } = data_queries[k as keyof EdrTypes.DataQueries]!
                const of = variables.output_formats || output_formats;
                const url = new URL(href)

                switch (k) {
                    case "position":
                        url.searchParams.set("coords", "POINT(36 1)");
                        break;
                    case "area":
                        url.searchParams.set("coords", `POLYGON ((-180 -90,-180 90,180 90,180 -90,-180 -90))`);
                        break;
                    case "corridor":
                        url.searchParams.set("coords", `LINESTRING(40 1, 39 1, 36 1)`);
                        url.searchParams.set("corridor-width", "1000");
                        url.searchParams.set("corridor-height", "1000");
                        url.searchParams.set("width-units", variables["width_units"][0]);
                        url.searchParams.set("height-units", variables["height_units"][0]);
                        break;
                    case "cube":
                        url.searchParams.set("bbox", "-180,-90,180,90");
                        break;

                    case "radius":
                        url.searchParams.set("coords", "POINT(36 1)");
                        url.searchParams.set("within", "1000");
                        url.searchParams.set("within-units", variables["within_units"][0]);
                        break;
                    case "trajectory":
                        url.searchParams.set("coords", `LINESTRING(40 1, 39 1, 36 1)`);
                        break;
                    //Do nothing
                    case "instances":
                    case "items":
                    case "locations":
                        break;
                }
                await t.step({
                    name: `${id} ${k} default_output_format checks`, async fn(t) {
                        res = await fetch(url);
                        expect(res.status, "Successful request expected").toBe(200)
                        expect(res.headers.get("content-type")).toBe(contenttypes[variables.default_output_format.toLowerCase()]);
                        await res.body?.cancel()
                    }
                });
                await t.step({
                    name: `${id} ${k}  output_formats check`,
                    async fn() {
                        for (const f of of) {
                            url.searchParams.set("f", f);
                            res = await fetch(url);
                            expect(res.status, "Successful request expected").toBe(200)
                            expect(res.headers.get("content-type")).toBe(contenttypes[f.toLowerCase()]);
                            await res.body?.cancel()
                        }

                    }
                })
            }

        }

    }
})