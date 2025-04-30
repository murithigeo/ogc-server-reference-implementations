import type { ColumnType, Generated, Selectable } from 'kysely';

/**
 * @description model for the noaa hourly collection.
 * @summary Has multiple fields which are arrays which include the actual parameter value and metadata describing the value such as accuracy values etc.
 * Remember that Postgres Array values start with 1 instead of 0
 */
export interface ISD_GlobalHourly {
	//primary keyish
	station: string;
	//Datetime
	//select as Date
	datetime: string;
	//Name of station
	name: string | null;
	//Typical format
	//dddff(f)gddff(f)-> ddd(wind Direction in degrees), g (gusts), ddff(f) (gust speed)
	wind: string[];
	//Ceiling height: cig[0] is the ceiling height
	cig: string[] | null;
	//visibility. vis[0] is visibility in metres
	vis: string[] | null;
	// Temperature: temperature[0] is temp in terms of degrees and at a factor of 10 thus temp=temp/10
	temperature: string[] | null;
	//dewpoint temperature: Similar to temperature
	dew: string[] | null;
	//sea level pressure: slp[0] is pressure (hPa) thus pressure=slp/10
	slp: string | null;
	//country
	country: string;
	subregion: string;
	//geometry of station
	geom: GeoJSON.Point;
}

export interface FeaturesPoints {
	name: string;
	regions: ColumnType<Array<string> | null>;
	countries: ColumnType<Array<string>>;
	continent: string;
	height_ft: number;
	height_m: number;
	geom: ColumnType<GeoJSON.Point, string>;
}

/**
 * Table to standardize queryable locations, especially for vector features
 */
export interface Countries {
	gid: number;
	iso3: string;
	status: string;
	color_code:string;
	name:string;
	continent:string;
	region:string;
	iso_3166_1_:string;
	french_shor:string
	geom: GeoJSON.MultiPolygon;
}
