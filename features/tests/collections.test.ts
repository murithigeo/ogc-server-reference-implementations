import { expect, describe, it } from "vitest";
import { MAX_COLLECTIONS_INSTANCES, TEST_URL_BASE } from "./index.test.ts";

const collections: {
  id: string;
  crs: string[];
  [x: string]: any;
  links: Array<{ href: string; type?: string }>;
}[] = [];
let res = await fetch(`${TEST_URL_BASE}/features/collections`);
const data = await res.json();
collections.push(...data.collections.slice(0, MAX_COLLECTIONS_INSTANCES));



describe.each(collections)("$id extent tests", (c) => {
  describe("spatial", () => {
    it("bbox member is defined", () => {
      expect(Array.isArray(c.extent.spatial.bbox[0])).toBe(true);
    });
    it("crs member is defined and is OGC:CRS84", () => {
      expect(c.extent.spatial.crs).toBeOneOf([
        "OGC:CRS84",
        "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
      ]);
    });
  
  });
  describe.skip("temporal", () => {
    it("interval member is defined", () => {});
  });
  describe.skip("vertical", () => {});
});

describe.each(collections)("misc checks", (c) => {
  it("has a id member", () => {
    // Make a http request to /collections/c.id
    // or /collections/c.id/instances/c.id
    expect(typeof c.id).toBe("string");
  });
  it("may have a keywords member", { skip: !c.keywords }, () => {
    expect(Array.isArray(c.keywords)).toBeTruthy();
  });

  // it.each(c.links)(
  //   "must have links array",
  //   { skip: !c.links },
  //   async (l) => {
  //     res = await fetch(l.href);
  //     expect(res.status).toBeOneOf([200, 400]);
  //     await res.body?.cancel();
  //   }
  // );
});
