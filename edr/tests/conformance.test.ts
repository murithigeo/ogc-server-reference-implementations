import { expect } from "@std/expect";
import { describe, it, beforeAll } from "@std/testing/bdd";
import { TEST_URL_BASE } from "./index.test.ts";

describe("/edr/conformance", () => {
  let res: Response, data: any;
  beforeAll(async () => {
    res = await fetch(`${TEST_URL_BASE}/edr/conformance`);
    data = await res.json();
  });
  it("should return a 200 status code", () => {
    expect(res.status).toBe(200);
  });
  it("response should have a conformsTo member", () => {
    expect(data.conformsTo).toBeDefined();
    expect(Array.isArray(data.conformsTo)).toBeTruthy();
  });
  it("can have links which return 200 status code", async (t) => {
    for (const link of data?.links || []) {
      res = await fetch(link.href);
      expect(res.status).toBe(200);
      await res.body?.cancel();
      // expect(res.headers.get("content-type")).toBeCloseTo()
    }
  });
});