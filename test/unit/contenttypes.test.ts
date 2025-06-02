import { expect } from "@std/expect";
import { contenttypes } from "../../src/common/utils/contenttypes";

Deno.test({
    name: "contentypes object test",
    fn() {
        expect(contenttypes.coveragejson).toBe("application/prs.coverage+json");
        expect(contenttypes.yaml).toBe("text/yaml");
        expect(contenttypes.json).toBe("application/json");
        expect(contenttypes.geojson).toBe("application/geo+json");
    }
})