import type { AliasedExpression, ExpressionBuilder } from 'kysely';
import type { Database } from './db.ts';
import type { ReferenceExpression } from 'kysely';
import type { CrsConfig } from '../types/types.js';
import { stf } from './kysely-postgis/index.ts';

/**
 * A wrapper for PostGIS functions to return valid GeoJSON geometries
 */
export const transformGeom = (
	eb: ExpressionBuilder<Database, keyof Database>,
	options?: CrsConfig,
	col?: ReferenceExpression<Database, keyof Database>
) => {
	
	//@ts-expect-error
	const g2 = stf(eb).transform(col || 'geom', `EPSG:${options.srid || 4326}`);

	const g25 = !options?.flipCoords ? stf(eb).flipCoordinates(g2) : g2;
	// Force to 3D/2D according to SRID
	const g3 = options?.['3D'] || false ? stf(eb).force3d(g25) : stf(eb).force2d(g25);

	// Cast to GeoJSON
	return stf(eb).asGeoJSON(g3).as('geom') as AliasedExpression<string, 'geom'>;
};
