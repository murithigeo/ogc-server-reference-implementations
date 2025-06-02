import { expect } from "@std/expect";
import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "../../index";

const { collections }: EdrTypes.Collections = await (await fetch(`${TEST_URL_BASE}/edr/collections`)).json()

let colls = [...collections];
for (const { data_queries } of collections) {
    if (data_queries.instances) {
        const { instances }: EdrTypes.Instances = await (await fetch(data_queries.instances.link.href)).json()
        colls.push(...instances.slice(0, MAX_COLLECTIONS_INSTANCES))
    }
}


Deno.test({
    name: "crs/crs_details test", async fn(t) {

        for (const { id, data_queries, crs: _crs } of colls) {
            for (const query_type of Object.keys(data_queries)) {
                const { link: { href, variables } } = data_queries[query_type as keyof EdrTypes.DataQueries]!
                let url = new URL(href);
                switch (query_type as keyof EdrTypes.DataQueries) {
                    case "position":
                        url.searchParams.set("coords", "POINT(36 1)");
                        break;
                    case "area":
                        url.searchParams.set("coords", "POLYGON((-180 -90,-180 90,180 90,180 -90,-180 -90))");
                        break;
                    case "corridor":
                        url.searchParams.set("coords", "LINESTRING(40 1,39 1,38 1)");
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
                    //case "locations":
                    case "radius":
                        url.searchParams.set("within", "1000");
                        url.searchParams.set("coords", "POINT(36 1)")
                        url.searchParams.set("within-units", variables["within_units"][0]);
                        break;
                    case "trajectory":
                        url.searchParams.set("coords", "LINESTRING(40 1,39 1,38 1)");
                        break
                }


                for (const { crs } of (variables.crs_details || _crs.map(crs => ({ crs, wkt: "" }))).slice(0, 2 )) {
                    await t.step({
                        ignore: ["instances"].includes(query_type),
                        name: `collection:${id} data_query:${query_type} ${crs}`,
                        async fn(t) {
                            url.searchParams.set("crs", crs);
                            let res = await fetch(url);
                            expect(res.status).toBe(200);
                            expect(res.headers.get("content-crs")).toBe(`<${crs}>`)
                            await res.body?.cancel()
                        },
                    })

                }
                await t.step({
                    ignore: ["instances"].includes(query_type),
                    name: "Incorrect crs", async fn(t) {
                        url.searchParams.set("crs", "EPSG:4326");
                        let res = await fetch(url);
                        expect(res.status).toBe(400);
                        await res.body?.cancel()
                    },
                })
            }
        }
    }
})