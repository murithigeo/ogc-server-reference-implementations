//import { describe, test } from "vitest";
import { expect } from "@std/expect";
import { TEST_URL_BASE } from "../index.ts";
/*
describe('service-doc Test', async (t) => {
	const res = await fetch('${TEST_URL_BASE}/features/api.html');

	test('Expect a 200 status code', (t) => {
		t.expect(res.status).toBe(200);
	});

	t.skipIf(res.status !== 200)('Content-type header should be text/html', (t) => {
		t.expect(res.headers.get('content-type')).toBe('text/html');
	});
});

describe('service-desc Test', async (t) => {
	const res = await fetch('${TEST_URL_BASE}/features/api');

	test('Expect a 200 status code', (t) => {
		t.expect(res.status).toBe(200);
	});

	describe.skipIf(res.status !== 200)('Other tests if res is successful', () => {
		test('Content-type header should be application/vnd.oai.openapi+json;version=3.0', (t) => {
			t.expect(res.headers.get('content-type')).toBe(
				'application/vnd.oai.openapi+json;version=3.0'
			);
		});

		describe('document to have openapi,servers,info,paths, ...etc members', async (t) => {
			const json = await res.json();
			test('doc should have info prop', (t) => {
				t.expect(json).toHaveProperty('info');
			});
            test('doc should have openapi prop', (t) => {
				t.expect(json).toHaveProperty('openapi');
			});
            test('doc should have servers prop', (t) => {
				t.expect(json).toHaveProperty('servers');
			});
            test('doc should have paths prop', (t) => {
				t.expect(json).toHaveProperty('paths');
			});
		});
	});
});
*/

Deno.test({
  name: "Features /api.html test",
  async fn() {
    const _res = await fetch(`${TEST_URL_BASE}/features/api.html`);
    expect(_res.status).toBe(200);
    expect(_res.headers.get("content-type")).toBe("text/html");
    await _res.body?.cancel();
  },
});

Deno.test({
  name: "Features /api test",
  async fn(t) {
    const url = new URL(`${TEST_URL_BASE}/features/api`);
    await t.step({
      name: "json tests",
      async fn() {
        const _res = await fetch(url);
        expect(_res.headers.get("content-type")).toBe(
          "application/vnd.oai.openapi+json;version=3.0"
        );
        await _res.body?.cancel();
      },
    });
    await t.step({
      name: "yaml tests",
      async fn() {
        const _url2 = new URL(url);
        _url2.searchParams.set("f", "yaml");
        const _res = await fetch(_url2);
        expect(_res.headers.get("content-type")).toBe(
          "application/vnd.oai.openapi;version=3.0"
        );
		await _res.body?.cancel()
      },
    });
  },
});
