import { contenttypes, MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "../..";
import { expect } from "@std/expect";


const { collections }: EdrTypes.Collections = await (await fetch(`${TEST_URL_BASE}/edr/collections`)).json()

let colls = [...collections];
for (const { data_queries } of collections) {
    if (data_queries.instances) {
        const { instances }: EdrTypes.Instances = await (await fetch(data_queries.instances.link.href)).json()
        colls.push(...instances.slice(0, MAX_COLLECTIONS_INSTANCES))
    }
}

for (const { id, data_queries: { corridor }, ...r } of collections) {
    const MSA_NBO_KSM = "LINESTRING (39.627686 -4.039618, 36.848145 -1.285293, 34.760742 -0.109863)"
    const { link: { href, variables } } = corridor!
    const validUrl = URL.canParse(href);
    let res: Response;
    Deno.test({
        name: "href is a valid link",
        fn() {
            expect(validUrl).toBeTruthy()

        }
    })

    const uri = new URL(href);

    Deno.test({
        name: "Width-units array length",
        ignore: !validUrl,
        async fn(t) {
            expect(variables.width_units.length).toBeGreaterThan(0);
        }
    })

    Deno.test({
        name: "Height-Units",
        ignore: !validUrl
        , async fn(t) {
            expect(variables.height_units.length).toBeGreaterThan(0)
        }
    })

    Deno.test({
        name: "Coords tests",
        ignore: !validUrl && !variables.width_units.length && !variables.height_units.length,
        async fn(t) {
            const uri = new URL(href);
            uri.searchParams.set("width-units", variables.width_units[0]);
            uri.searchParams.set("height-units", variables.height_units[0]);
            uri.searchParams.set("corridor-height", "1000");
            uri.searchParams.set("corridor-width", "1000");

            await t.step({
                name: "Mismatched coordinates",
                async fn(t) {
                    uri.searchParams.set("coords", "POINT(36 1)");
                    res = await fetch(uri);
                    expect(res.status).toBe(400);
                    await res.body?.cancel()
                },
            })

            await t.step({
                name: "coords with syntax error",
                async fn(t) {
                    uri.searchParams.set("coords", MSA_NBO_KSM.substring(0, MSA_NBO_KSM.length - 1));
                    res = await fetch(uri);
                    expect(res.status).toBe(400);
                    await res.body?.cancel()

                },
            })

            await t.step({
                name: "valid coordinates",
                async fn(t) {
                    await t.step({
                        name: "LINESTRING",
                        async fn(t) {
                            uri.searchParams.set("coords", MSA_NBO_KSM)
                            res = await fetch(uri);
                            expect(res.status).toBe(200);
                            await res.body?.cancel()
                        },
                    })

                    await t.step({
                        name: "LINESTRING Z", async fn(t) {
                            uri.searchParams.set("coords", `LINESTRINGZ(39 1 100, 36 1 100)`);
                            res = await fetch(uri);
                            expect(res.status).toBe(200)
                            await res.body?.cancel()
                            // Ensure that a combination of z param and LINESTRING is considered an error
                            uri.searchParams.set("z", "100");
                            res = await fetch(uri);
                            expect(res.status).toBe(400)
                            await res.body?.cancel()
                        },
                    })

                    await t.step({
                        name: "LINESTRING M",
                        async fn() {
                            uri.searchParams.set("coords", `LINESTRINGM(39 1 ${new Date().getTime()},36 1 ${new Date().getTime() - 1000000})`)
                            res = await fetch(uri);
                            expect(res.status).toBe(200);
                            await res.body?.cancel();

                            //
                            uri.searchParams.set("datetime", new Date().toISOString())
                            res = await fetch(uri);
                            expect(res.status).toEqual(400)
                            await res.body?.cancel()
                        }
                    })
                },
            })
        },
    })
    Deno.test({
        name: "width-units & height-units", async fn(t) {
            let uri = new URL(href);
            uri.searchParams.set("coords", MSA_NBO_KSM);
            uri.searchParams.set("corridor-height", "1000")
            uri.searchParams.set("corridor-width", "1000")
            await t.step({
                name: "Missing width-units", async fn(t) {
                    uri.searchParams.set("height-units", variables.height_units[0])
                    uri = new URL(uri);
                    res = await fetch(uri);
                    expect(res.status).toBe(400);
                    await res.body?.cancel()
                },
            })

            await t.step({
                name: "Missing height-units", async fn() {
                    uri.searchParams.set("width-units", variables.width_units[0])
                    uri.searchParams.delete("height-units")
                    res = await fetch(uri);
                    expect(res.status).toBe(400)
                    await res.body?.cancel()
                }
            })


        }
    })

    Deno.test({ name: "corridor-height", async fn() { } })

    Deno.test({
        name: "crs_details", async fn(t) {

        }
    })

    Deno.test({
        name: "Output Formats", async fn(t) {
            for (const f of r.output_formats || variables.output_formats) {
                uri.searchParams.set("f", f);


            }
        }
    })
}