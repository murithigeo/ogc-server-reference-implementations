import { ExegesisContext } from "exegesis-express"
import { FeaturesRqManager } from "../../src/standards/features/features.utils"
import { expect } from "@std/expect"
import { CrsManager } from "../../src/common/utils/CrsManager"

Deno.test({
    name: "FeaturesRqManager",
    async fn(t) {
        let ctx: ExegesisContext = {
            api: {
                
            },
            params: {
                query: {
                    f: "JSON",
                    "bbox-crs": "http://www.opengis.net/def/crs/EPSG/0/4326"
                },
                path: {},
                server: {},
                "cookie": {},
                "header": {}
            },

        }
        let manager = new FeaturesRqManager({ ctx })
        await t.step({
            name: "bbox-crs",
            fn(t) {
                let { bboxCrs } = manager.bboxCrsParser();
                expect(bboxCrs).toBe(new CrsManager().getCrsByUri("http://www.opengis.net/def/crs/EPSG/0/4326"))
            },
        })

        await t.step({
            name: "f",
            fn(t) {
                let { f } = manager.outputFormatParser("yaml", ["json", "yaml"]);
                expect(f).toBe("json")
            },
        })

    }
})