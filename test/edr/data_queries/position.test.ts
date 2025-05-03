import { TEST_URL_BASE,type EdrTypes } from "../../index.ts";

Deno.test({
  name: `Data Query: POSITION tests`,
  async fn(t) {
    const base = `${TEST_URL_BASE}/edr/collections`;
    const baseRes = await fetch(base);
    const { collections }: { collections: EdrTypes.Collection[] } =
      await baseRes.json();
    for (const {
      data_queries: { position },
      id,
    } of collections) {
      const {
        link: {
          href,
          variables: { crs_details, output_formats,default_output_format, },
        },
      } = position!;
      await t.step({
        ignore: !position,
        name: `collection: ${id} tests`,
        async fn(t) {
          await t.step({
            name: `href is a valid URL`,
            fn() {
              //expect(/);
            },
          });
        },
      });
    }
  },
});
