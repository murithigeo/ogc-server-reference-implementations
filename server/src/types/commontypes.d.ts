//import GeoJSON from "npm:@types/geojson"
import type GeoJSON from "@types/geojson"
//Recommended by COVJSON && By EDR
type CoverageJSONMediaType = 'application/vnd.cov+json' | 'application/prs.coverage+json';
export as namespace CommonTypes;

export interface AppConfigOptions {
	urls: string[];
}
export interface Link {
	href: string;
	rel:
		| 'items'
		| 'data'
		| 'conformance'
		| 'service-desc'
		| 'service-doc'
		| 'next'
		| 'prev'
		| 'alternate'
		| 'self'
		| 'enclosure'
		| 'license'|string;
	title: string;
	type: string;
	hreflang?: string;
	length?: number;
	templated?: boolean;
}

export interface Root {
	links: Link[]
	title?: string;
	description?: string;
}

export interface Collection {
	description?: string;
	id: string;
	title?: string;
	storageCrsCoordinateEpoch?: number;
	/**Coordinate reference systems supported by the collection */
	crs: string[];
	/** */
	storageCrs?: string;
	itemType?: string | 'feature';
	extent: Extent;
	//Required on */{collectionId} but on */collections
	links?: Link[];
}

export interface Collections {
	collections:Collection[];
	links:Link[];
}
/**
    * @description  One or more bounding boxes that describe the spatial extent of the dataset.
    * In the Core only a single bounding box is supported. Extensions may support additional areas. If multiple areas are provided, the union of the bounding boxes describes the spatial extent.
    * OGCAPI Features recommends that the first Bbox be the intersection of subsequent elements 
    * Each bounding box is provided as four or six numbers, depending on

            whether the coordinate reference system includes a vertical axis

            (height or depth):


            * Lower left corner, coordinate axis 1

            * Lower left corner, coordinate axis 2

            * Minimum value, coordinate axis 3 (optional)

            * Upper right corner, coordinate axis 1

            * Upper right corner, coordinate axis 2

            * Maximum value, coordinate axis 3 (optional)


            The coordinate reference system of the values is WGS 84 longitude/latitude

            (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate

            reference system is specified in `crs`.


            For WGS 84 longitude/latitude the values are in most cases the sequence of

            minimum longitude, minimum latitude, maximum longitude and maximum latitude.

            However, in cases where the box spans the antimeridian the first value

            (west-most box edge) is larger than the third value (east-most box edge).


            If the vertical axis is included, the third and the sixth number are

            the bottom and the top of the 3-dimensional bounding box.


            If a feature has multiple spatial geometry properties, it is the decision of the

            server whether only a single spatial geometry property is used to determine

            the extent or all relevant geometries.
            @warning Many current implementations of the test suite do not support the 6-element bbox yet
    * */

export type Bbox =
	| [number, number, number, number]
	| [number, number, number, number, number, number];
export interface Extent {
	/**
	 * @description The spatial extent of the information in the collection.
	 */
	spatial: {
		bbox: Bbox[];
		/**
		 * @description Coordinate reference system of the coordinates in the spatial extent (property `bbox`). The default reference system is WGS 84 longitude/latitude. In the Core this is the only supported coordinate reference system. Extensions may support additional coordinate reference systems
		 * OGCAPI Features recommends a syntax similar to an URI.
		 * OGCAPI EDR recommends a WKT representation of the CRS.
		 */
		crs: string | CrsConfig['crs'] | 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';
	};
	temporal: {
		/**OGCAPI Features recommends that the first element be intersection of subsequent elements */
		interval: [string | null, string | null][];
		/**Temporal Reference System of the interval values */
		trs: string;
	};
}

export interface Feature extends GeoJSON.Feature {
	id: string | number;
	links?: Link[];
}
export interface FeatureCollection extends GeoJSON.FeatureCollection {
	links?: Link[];
	numberMatched: number;
	numberReturned: number;
	timeStamp: string;
	features: Feature[];
}

export interface ConformanceDocument {
	links?: Link[];
	conformsTo: string[];
}
export interface CrsConfig {
	type: 'GeographicCRS' | 'ProjectedCRS';
	/**Templated string as defined in OGCAPI Features Part 2 */
	crs: `http://www.opengis.net/def/crs/${string}/${number}/${string}` | string;
	/**Well Known Text String of the CRS */
	wkt: string;
	/** */
	version: number;

	code: string | number;
	/**Spatial Reference Identifier
	 * @example 4326
	 * @description: CRS84, CRS84h, CRS27, CRS83 have the SRIDs 4326,4327,4269,4267 in the PostGIS
	 */
	srid: number;
	/** */
	authority: string;
	/**Whether the CRS is 3D (Has Height) */
	hasZ: boolean;
	/** Intended for use with an ORM. Postgis stores data in lngLat.
	 * Why: CRS84 is just EPSG:4326 (LatLng) but with LngLat
	 */
	flipCoords: boolean;
}
