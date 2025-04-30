//Common Test Suites for objects such as Link, crs

import { test, describe, expect } from 'vitest';

export const crsTests = describe('Test against collection.crs', ({}) => {
	test('No errors against listed CRS', async ({
		crs,
		endpoint
	}: {
		crs: string[];
		endpoint: URL;
	}) => {
		for (const uri of crs) {
			endpoint.searchParams.set('crs', uri);
			const res = await fetch(endpoint);
			expect(res.status).toBe(200);
		}
	});
});
