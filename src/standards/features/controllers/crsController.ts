import type { ExegesisContext } from "exegesis";
import { FeaturesRqManager } from "../features.utils.ts";
import { CRS84 } from "../../../common/utils/CrsManager.ts";

export default {
  getCollectionCrs(ctx: ExegesisContext): void {
    const { collection } = new FeaturesRqManager({ ctx }).collectionParser();
    ctx.res.status(200).json(collection.crs);
  },
  getGlobalCRSs(ctx: ExegesisContext): void {
    ///const { collections } = new FeaturesRqManager({ ctx });
    /**
     * @external https://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript
     */
    /*
    const commonArray = <T>(array1: Array<T>, array2: Array<T>) =>
      array1.filter((value) => array2.includes(value));
    const commonCrs = collections
      .map(({ crs }) => crs)
      .map((array1, i, arr) => commonArray(array1, arr[i + 1]||[CRS84]))
      .flat(1);
      console.log(commonCrs)
      */
    ctx.res.status(200).json([CRS84]);
  },
};
