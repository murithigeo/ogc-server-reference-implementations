//
import { expect } from "@std/expect";
import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "../index";

const { collections }: { collections: EdrTypes.Collection[] } = await (await fetch(`${TEST_URL_BASE}/edr/collections`)).json();

let colls = [...collections];
for (const { data_queries } of collections) {
    if (data_queries.instances) {
        const { instances }: EdrTypes.Instances = await (await fetch(data_queries.instances.link.href)).json()
        colls.push(...instances.slice(0, MAX_COLLECTIONS_INSTANCES))
    }
}

for (const { id, data_queries, parameter_names } of colls) {
    let pnames = Object.keys(parameter_names);
    Object.entries(data_queries).forEach(([query_type, v]: [query_type: string, v: EdrTypes.DataQueries[keyof EdrTypes.DataQueries]]) => {

        const { link: { href, variables }, } = v!
        const url = new URL(href);
        let res: Response;
        switch (query_type) {
            case "position":
                url.searchParams.set("coords", "POINT(36 1)")
                break;
            case "area":
                url.searchParams.set("coords", "POLYGON((-180 -90, -180 90, 180 90, 180 -90, -180 -90))")
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
            //case "instances":
            //case "items":

            // Does not work on /locations but does work on /locations/{locationId}
            //case "locations":
            case "radius":
                url.searchParams.set("coords", "POINT(36 1)");
                url.searchParams.set("within-units", variables["within_units"][0])
                url.searchParams.set("within", "1000")
                break;
            case "trajectory":
                url.searchParams.set("coords", `LINESTRING(40 1, 39 1, 36 1)`);
                break
        }

        Deno.test({
            ignore: !(["corridor", "trajectory", "position", "radius", "area", "cube"].includes(query_type)),
            name: `${id} ${query_type} PARAMETER-NAME tests`, async fn(t) {
                await t.step({
                    name: `Singular incorrect value`,
                    async fn() {
                        url.searchParams.set("parameter-name", "gibberish");
                        const res = await fetch(url);
                        expect(res.status).toBe(400);
                        await res.body?.cancel()
                    },
                })
                await t.step({
                    name: "Correct values",
                    async fn() {
                        url.searchParams.set("parameter-name", pnames.join(","))
                        res = await fetch(url);
                        expect(res.status).toBe(200);
                        await res.body?.cancel()
                    }
                })
                await t.step({
                    name: `Correct values including incorrect value such a empty string`,
                    async fn() {
                        url.searchParams.set("parameter-name", pnames.join(",").concat(", "));
                        res = await fetch(url);
                        expect(res.status).toBe(400)
                        await res.body?.cancel()
                    }
                })
            },
        })
    })
}
