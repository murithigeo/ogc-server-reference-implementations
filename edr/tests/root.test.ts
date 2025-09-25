import { TEST_URL_BASE } from "./index.test.ts";
import { contenttypes } from "@template/utils";
import { expect } from "@std/expect";
import { describe, it, beforeAll } from "@std/testing/bdd";

describe("/ Test Suite", () => {
  let data;
  let res: Response;
  beforeAll(async () => {
    res = await fetch(`${TEST_URL_BASE}/edr/`);
    data = await res.json();
    console.log(data)
  });

  describe("Resource Accessible", () => {
    it("should be accessible", () => {
      expect(res.status).toBe(200);
    });
    it("should return a json body", () => {
      expect(res.headers.get("content-type")).toBe("application/json");
    });
  });

  describe("Response Body Checks", () => {
    describe("Links member", () => {
      describe("{href} in the link elements should be accessible", () => {
        console.log(data.links)
        for (let i = 0; i < data.links.length; i++) {
          const link = data.links[i];

          beforeAll(async () => {
            res = await fetch(link.href);
            await res.body?.cancel();
          });

          it(`link at index:${i} should be successfully accessible`, () => {
            expect(res.ok).toBe(true);
          });
          it(
            `response from links[${i}] should return with assigned content type`,
            { ignore: !link.type },
            () => {
              expect(res.headers.get("content-type")).toBe(link.type);
            }
          );
        }
      });
      it("links should contain rels pointing to core paths", () => {
        expect(data.links).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ rel: "data" }),
            expect.objectContaining({ rel: "service-desc" }),
            expect.objectContaining({ rel: "service-doc" }),
            expect.objectContaining({ rel: "conformance" }),
          ])
        );
      });
    });

    describe("Provider Member Checks", { ignore: !data?.provider }, () => {
      it("should have a name", () => {
        expect(data.provider.name).toBeDefined();
      });
      it("should have a valid url", async () => {
        expect(data.provider.url).toBeDefined();
        expect((await fetch(data.provider.url)).status).toBe(200);
      });
    });
  });
});
