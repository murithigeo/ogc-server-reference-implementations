import crs from "./crsproperties.json" with { type:"json"};
export const CRS84: CommonTypes.CrsConfig['crs'] = `http://www.opengis.net/def/crs/OGC/1.3/CRS84`;
export const TRS_Gregorian="http://www.opengis.net/def/uom/ISO-8601/0/Gregorian";
export class CrsManager {
  allCrs: CommonTypes.CrsConfig[];
  constructor() {
    this.allCrs = (Object.values(crs))
  }

  get All() {
    return this.allCrs;
  }

  getCrsByAuth(authority: string): CommonTypes.CrsConfig[] {
    return this.allCrs.filter((crs) => crs.authority === authority);
  }
  getCrsByUri(uri: string): CommonTypes.CrsConfig | undefined {
    const crs= this.allCrs.find((crs) => crs.crs === uri);
    return crs
  }

  getCrsByVersion(version: number) {
    return this.allCrs.filter((crs) => crs.version === version);
  }
  getCrsByCode(code: string | number) {
    return this.allCrs.find((crs) => crs.code === code);
  }
 
}


export const CRS84Attr:CommonTypes.CrsConfig = new CrsManager().getCrsByUri(CRS84)!