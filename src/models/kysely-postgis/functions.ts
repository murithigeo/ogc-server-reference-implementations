import type { GeometryCollection, Geometry, MultiPolygon, Point, Polygon } from 'geojson';
import { type ExpressionBuilder, type ReferenceExpression, sql } from 'kysely';
import {
	fnCompare,
	fnWithAdditionalParameters,
	isNil,
	transformGeoJSON,
	valueForGeoJSON,
	valueForWKT,
	withDefaultOptions
} from './utils.js';
import type { SRID, STParams } from './types.js';

export interface Options {
	validate: boolean;
	additionalParameters: any[]; // Pass these parameters to the ST function
}

export interface OptionsAsGeoJSON extends Options {
	maxDecimalDigits?: number;
	options?: number;
}

export function asGeoJSON<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	column: ReferenceExpression<DB, TB>,
	options: Partial<OptionsAsGeoJSON> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	const fnOptions = isNil(options.options) ? [] : [sql.val<number>(options.options)];
	const maxDecimalDigits =
		fnOptions.length > 0 || !isNil(options.maxDecimalDigits)
			? [sql.val<number>(optionsWithDefault.maxDecimalDigits ?? 9)]
			: [];

	return fnWithAdditionalParameters<DB, TB, Geometry &{crs?:{}}>(
		eb,
		'ST_AsGeoJSON',
		[column, ...maxDecimalDigits, ...fnOptions],
		optionsWithDefault
	);
}

export interface OptionsFromGeoText extends Options {
	srid?: SRID;
}

export function geomFromGeoJSON<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	value: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	const geo = valueForGeoJSON(value, optionsWithDefault);
	return fnWithAdditionalParameters(eb, 'ST_GeomFromGeoJSON', [geo], optionsWithDefault);
}

export function geomFromText<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	value: string,
	options: Partial<OptionsFromGeoText> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	const geo = valueForWKT(value, optionsWithDefault);
	return fnWithAdditionalParameters(
		eb,
		'ST_GeomFromText',
		[geo, ...(isNil(optionsWithDefault.srid) ? [] : [sql.val<number>(optionsWithDefault.srid)])],
		optionsWithDefault
	);
}

export interface OptionsArea extends Options {
	useSpheroid?: boolean;
}

export function area<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	value: Polygon | MultiPolygon | ReferenceExpression<DB, TB>,
	options: Partial<OptionsArea> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Area',
		[
			transformGeoJSON(eb, value, optionsWithDefault),
			...(isNil(optionsWithDefault.useSpheroid)
				? []
				: [sql.val<boolean>(optionsWithDefault.useSpheroid)])
		],
		optionsWithDefault
	);
}

export function asText<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	column: ReferenceExpression<DB, TB>
) {
	return eb.fn<string>('ST_AsText', [column]);
}

export function boundary<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	value: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Boundary',
		[transformGeoJSON(eb, value, optionsWithDefault)],
		optionsWithDefault
	);
}

export function buffer<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	value: Geometry | ReferenceExpression<DB, TB>,
	radius: number,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Buffer',
		[transformGeoJSON(eb, value, optionsWithDefault), sql.val<number>(radius)],
		optionsWithDefault
	);
}

export function centroid<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	value: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Centroid',
		[transformGeoJSON(eb, value, optionsWithDefault)],
		optionsWithDefault
	);
}

export function contains<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_Contains', geomA, geomB, [], options);
}

export function covers<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_Covers', geomA, geomB, [], options);
}

export function crosses<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_Crosses', geomA, geomB, [], options);
}

export function dWithin<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Geometry | ReferenceExpression<DB, TB>,
	geomB: Geometry | ReferenceExpression<DB, TB>,
	distance: number,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_DWithin', geomA, geomB, [sql.val<number>(distance)], options);
}

export function difference<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Difference',
		[
			transformGeoJSON(eb, geomA, optionsWithDefault),
			transformGeoJSON(eb, geomB, optionsWithDefault)
		],
		optionsWithDefault
	);
}

export function disjoint<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_Disjoint', geomA, geomB, [], options);
}

export function distance<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_Distance',
		[
			transformGeoJSON(eb, geomA, optionsWithDefault),
			transformGeoJSON(eb, geomB, optionsWithDefault)
		],
		optionsWithDefault
	);
}

export function distanceSphere<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Point | ReferenceExpression<DB, TB>,
	geomB: Point | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_Distance_Sphere',
		[
			transformGeoJSON(eb, geomA, optionsWithDefault),
			transformGeoJSON(eb, geomB, optionsWithDefault)
		],
		optionsWithDefault
	);
}

export function equals<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_Equals', geomA, geomB, [], options);
}

export function expand<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	value: Geometry | ReferenceExpression<DB, TB>,
	unitsToExpand: number,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Expand',
		[transformGeoJSON(eb, value, optionsWithDefault), sql.val<number>(unitsToExpand)],
		optionsWithDefault
	);
}

export function geoHash<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	value: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_GeoHash',
		[transformGeoJSON(eb, value, optionsWithDefault)],
		optionsWithDefault
	);
}

export function intersection<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Intersection',
		[
			transformGeoJSON(eb, geomA, optionsWithDefault),
			transformGeoJSON(eb, geomB, optionsWithDefault)
		],
		optionsWithDefault
	);
}

export function intersects<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_Intersects', geomA, geomB, [], options);
}

export function isValid<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB, boolean>(
		eb,
		'ST_IsValid',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function makeValid<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_MakeValid',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function maxDistance<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_MaxDistance',
		[
			transformGeoJSON(eb, geomA, optionsWithDefault),
			transformGeoJSON(eb, geomB, optionsWithDefault)
		],
		optionsWithDefault
	);
}

export function overlaps<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_Overlaps', geomA, geomB, [], options);
}

export function srid<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_SRID',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function scale<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	xFactor: number,
	yFactor: number,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Scale',
		[
			transformGeoJSON(eb, geom, optionsWithDefault),
			sql.val<number>(xFactor),
			sql.val<number>(yFactor)
		],
		optionsWithDefault
	);
}

export function segmentize<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	maxLength: number,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Segmentize',
		[transformGeoJSON(eb, geom, optionsWithDefault), sql.val<number>(maxLength)],
		optionsWithDefault
	);
}

export function setSRID<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	srid: SRID,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_SetSRID',
		[transformGeoJSON(eb, geom, optionsWithDefault), sql.val<number>(srid)],
		optionsWithDefault
	);
}

export function simplify<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	tolerance: number,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Simplify',
		[transformGeoJSON(eb, geom, optionsWithDefault), sql.val<number>(tolerance)],
		optionsWithDefault
	);
}

export function simplifyPreserveTopology<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	tolerance: number,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_SimplifyPreserveTopology',
		[transformGeoJSON(eb, geom, optionsWithDefault), sql.val<number>(tolerance)],
		optionsWithDefault
	);
}

export function transform<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	srid: SRID,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Transform',
		[transformGeoJSON(eb, geom, optionsWithDefault), eb.lit<number>(srid)],
		optionsWithDefault
	);
}

export function translate<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	deltaX: number,
	deltaY: number,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Translate',
		[
			transformGeoJSON(eb, geom, optionsWithDefault),
			sql.val<number>(deltaX),
			sql.val<number>(deltaY)
		],
		optionsWithDefault
	);
}

export function union<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB?: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters(
		eb,
		'ST_Union',
		[
			transformGeoJSON(eb, geomA, optionsWithDefault),
			...(geomB ? [transformGeoJSON(eb, geomB, optionsWithDefault)] : [])
		],
		optionsWithDefault
	);
}

export function within<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_Within', geomA, geomB, [], options);
}

export function x<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_X',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function y<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_Y',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function z<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_Z',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function m<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_M',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

// stf for spatial type functions
export function stf<DB, TB extends keyof DB>(eb: ExpressionBuilder<DB, TB>) {
	return {
		asGeoJSON: (...args: STParams<typeof asGeoJSON<DB, TB>>) => asGeoJSON(eb, ...args),
		geomFromGeoJSON: (...args: STParams<typeof geomFromGeoJSON<DB, TB>>) =>
			geomFromGeoJSON(eb, ...args),
		geomFromText: (...args: STParams<typeof geomFromText<DB, TB>>) => geomFromText(eb, ...args),
		area: (...args: STParams<typeof area<DB, TB>>) => area(eb, ...args),
		asText: (...args: STParams<typeof asText<DB, TB>>) => asText(eb, ...args),
		boundary: (...args: STParams<typeof boundary<DB, TB>>) => boundary(eb, ...args),
		buffer: (...args: STParams<typeof buffer<DB, TB>>) => buffer(eb, ...args),
		centroid: (...args: STParams<typeof centroid<DB, TB>>) => centroid(eb, ...args),
		contains: (...args: STParams<typeof contains<DB, TB>>) => contains(eb, ...args),
		covers: (...args: STParams<typeof covers<DB, TB>>) => covers(eb, ...args),
		crosses: (...args: STParams<typeof crosses<DB, TB>>) => crosses(eb, ...args),
		dWithin: (...args: STParams<typeof dWithin<DB, TB>>) => dWithin(eb, ...args),
		difference: (...args: STParams<typeof difference<DB, TB>>) => difference(eb, ...args),
		disjoint: (...args: STParams<typeof disjoint<DB, TB>>) => disjoint(eb, ...args),
		distance: (...args: STParams<typeof distance<DB, TB>>) => distance(eb, ...args),
		distanceSphere: (...args: STParams<typeof distanceSphere<DB, TB>>) =>
			distanceSphere(eb, ...args),
		equals: (...args: STParams<typeof equals<DB, TB>>) => equals(eb, ...args),
		expand: (...args: STParams<typeof expand<DB, TB>>) => expand(eb, ...args),
		geoHash: (...args: STParams<typeof geoHash<DB, TB>>) => geoHash(eb, ...args),
		intersection: (...args: STParams<typeof intersection<DB, TB>>) => intersection(eb, ...args),
		intersects: (...args: STParams<typeof intersects<DB, TB>>) => intersects(eb, ...args),
		isValid: (...args: STParams<typeof isValid<DB, TB>>) => isValid(eb, ...args),
		makeValid: (...args: STParams<typeof makeValid<DB, TB>>) => makeValid(eb, ...args),
		maxDistance: (...args: STParams<typeof maxDistance<DB, TB>>) => maxDistance(eb, ...args),
		overlaps: (...args: STParams<typeof overlaps<DB, TB>>) => overlaps(eb, ...args),
		srid: (...args: STParams<typeof srid<DB, TB>>) => srid(eb, ...args),
		scale: (...args: STParams<typeof scale<DB, TB>>) => scale(eb, ...args),
		segmentize: (...args: STParams<typeof segmentize<DB, TB>>) => segmentize(eb, ...args),
		setSRID: (...args: STParams<typeof setSRID<DB, TB>>) => setSRID(eb, ...args),
		simplify: (...args: STParams<typeof simplify<DB, TB>>) => simplify(eb, ...args),
		simplifyPreserveTopology: (...args: STParams<typeof simplifyPreserveTopology<DB, TB>>) =>
			simplifyPreserveTopology(eb, ...args),
		transform: (...args: STParams<typeof transform<DB, TB>>) => transform(eb, ...args),
		translate: (...args: STParams<typeof translate<DB, TB>>) => translate(eb, ...args),
		union: (...args: STParams<typeof union<DB, TB>>) => union(eb, ...args),
		within: (...args: STParams<typeof within<DB, TB>>) => within(eb, ...args),
		x: (...args: STParams<typeof x<DB, TB>>) => x(eb, ...args),
		y: (...args: STParams<typeof y<DB, TB>>) => y(eb, ...args),
		z: (...args: STParams<typeof z<DB, TB>>) => z(eb, ...args),
		m: (...args: STParams<typeof m<DB, TB>>) => m(eb, ...args),
		force3d: (...args: STParams<typeof force3d<DB, TB>>) => force3d(eb, ...args),
		flipCoordinates: (...args: STParams<typeof flipCoordinates<DB, TB>>) =>
			flipCoordinates(eb, ...args),
		force2d: (...args: STParams<typeof force3d<DB, TB>>) => force2d(eb, ...args),
		xMin: (...args: STParams<typeof xMin<DB, TB>>) => xMin(eb, ...args),
		yMin: (...args: STParams<typeof yMin<DB, TB>>) => yMin(eb, ...args),
		xMax: (...args: STParams<typeof xMax<DB, TB>>) => xMax(eb, ...args),
		yMax: (...args: STParams<typeof yMax<DB, TB>>) => yMax(eb, ...args),
		extent3d: (...args: STParams<typeof extent3d<DB, TB>>) => extent3d(eb, ...args),
		extent: (...args: STParams<typeof extent<DB, TB>>) => extent(eb, ...args),
		zMax: (...args: STParams<typeof zMax<DB, TB>>) => zMax(eb, ...args),
		zMin: (...args: STParams<typeof zMin<DB, TB>>) => zMin(eb, ...args),
		makeEnvelope: (...args: STParams<typeof makeEnvelope<DB, TB>>) => makeEnvelope(eb, ...args),
		intersects3d: (...args: STParams<typeof intersects3d<DB, TB>>) => intersects3d(eb, ...args),
		dWithin3d: (...args: STParams<typeof dWithin3d<DB, TB>>) => dWithin3d(eb, ...args)
	};
}

/**
 * Own functions
 */

/**
 * @external https://postgis.net/docs/ST_Force_3D.html
 */
export function force3d<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters(
		eb,
		'ST_Force3D',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

/**
 * @external https://postgis.net/docs/ST_Force2D.html
 */
export function force2d<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters(
		eb,
		'ST_Force2D',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

/**
 * @external https://postgis.net/docs/ST_FlipCoordinates.html
 */
export function flipCoordinates<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters(
		eb,
		'ST_FlipCoordinates',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function extent3d<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters(
		eb,
		'ST_3DExtent',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function extent<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters(
		eb,
		'ST_Extent',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}
export function xMin<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_XMin',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function yMin<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_YMin',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function xMax<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_XMax',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function yMax<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_Ymax',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function zMin<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_Zmin',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}
export function zMax<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geom: Geometry | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);
	return fnWithAdditionalParameters<DB, TB, number>(
		eb,
		'ST_Zmax',
		[transformGeoJSON(eb, geom, optionsWithDefault)],
		optionsWithDefault
	);
}

export function makeEnvelope<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	[xmin, ymin, xmax, ymax, srid = 4326]: [number, number, number, number, number],
	options: Partial<Options> = {}
) {
	const optionsWithDefault = withDefaultOptions(options);

	return fnWithAdditionalParameters<DB, TB>(
		eb,
		'ST_MakeEnvelope',
		[xmin, ymin, xmax, ymax, srid],
		optionsWithDefault
	);
}

export function intersects3d<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_3DInterse.js', geomA, geomB, [], options);
}

export function dWithin3d<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	geomA: Geometry | ReferenceExpression<DB, TB>,
	geomB: Geometry | ReferenceExpression<DB, TB>,
	distance: number,
	options: Partial<Options> = {}
) {
	return fnCompare(eb, 'ST_3DDWithin', geomA, geomB, [sql.val<number>(distance)], options);
}
