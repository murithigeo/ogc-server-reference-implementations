export type * as CommonTypes from "../src/types/commontypes.d.ts";
export type * as EdrTypes from "../src/types/edr.d.ts";
export { contenttypes } from "../src/common/utils/contenttypes.ts";
const TEST_URL_BASE = process.env.TEST_URL_BASE;
const MAX_COLLECTIONS_INSTANCES = parseInt(process.env?.MAX_INSTANCES || `3`);
if (!TEST_URL_BASE) {
  console.log(
    `env variable TEST_BASE_URL must be set before running tests. Must be a valid URL`
  );
  process.exit(1);
}
export { TEST_URL_BASE,MAX_COLLECTIONS_INSTANCES };
