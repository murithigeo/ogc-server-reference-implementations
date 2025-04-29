/**
 * @description central interface to export initialized models
 * Use Kysely because there is a new plugin to ease use of kysley-postgis plugin
 */
//import { Pool } from "pg";
import pg from 'pg';
const { Pool, types } = pg;
pg.types.setTypeParser(types.builtins.NUMERIC, (val) => parseFloat(val));
pg.types.setTypeParser(types.builtins.INT4, (val) => parseInt(val));
import {
	Kysely,
	PostgresDialect,
	ParseJSONResultsPlugin,
	type TableExpression,
	type ReferenceExpression
} from 'kysely';
import * as models from './models.ts';

export interface Database {
	isd: models.ISD_GlobalHourly;
	features_points: models.FeaturesPoints;
	countries: models.Countries;
}

const dialect = new PostgresDialect({
	pool: new Pool({
		database: process.env.DATABASE_NAME || 'postgres',
		host: process.env.DATABASE_HOST || 'localhost',
		user: process.env.DATABASE_USER || 'postgres',
		password: process.env.DATABASE_PASS || 'postgres',
		max: 10
	})
});

export const db = new Kysely<Database>({
	dialect,
	plugins: [new ParseJSONResultsPlugin()],
	log(event) {
		console.log((event.level === 'error' ? 'error' : 'success').toUpperCase(), event.query.sql);
		console.log(event.query.parameters, `\t ${event.queryDurationMillis} ms`);
	}
});

export type RefExpression = ReferenceExpression<Database, keyof Database>;
