import { PostgresDBConnection, QueryResultRow } from './PostgresDBConnection';
import { logger } from '../Logger';
import { DBType } from '../types';
import {
	GenericDBConnection,
	type DBInstance,
	type ExecuteQueryType,
} from './GenericDBConnection';
import { MongoDBConnection } from './MongoDBConnection';
import { RedisClient } from '../cachingClients/redis';
import { constants } from '../constants';

export const getLimitCond = (currentDB: DBType, count: number): string => {
	switch (currentDB) {
		case 'mysql':
			return `LIMIT ${count}`;
		case 'oracle':
			return `FETCH FIRST ${count} ROWS ONLY`;
		case 'postgres':
			return `FETCH FIRST ${count} ROWS ONLY`;
		default:
			return '';
	}
};

export const getGenericDBInstance = async (
	currentDB: DBType,
): Promise<GenericDBConnection> => {
	const genericInstance = await GenericDBConnection.getInstance(currentDB);

	if (!genericInstance) {
		throw new Error(`Failed to get DB instance for ${currentDB}`);
	}

	return genericInstance;
};

export const getDBInstance = async (currentDB: DBType): Promise<DBInstance | null> => {
	const genericInstance = await getGenericDBInstance(currentDB);
	return genericInstance.getDBInstance();
};

export async function executeQuery<T extends QueryResultRow>(
	query: string,
	params?: any[],
): Promise<T[]> {
	try {
		const dbClient = await PostgresDBConnection.getInstance({});
		return await dbClient.executeQuery<T>(query, params);
	} catch (error) {
		logger.error(error);
		throw error;
	}
}

export async function disconnectDBs() {
	return Promise.allSettled([
		MongoDBConnection.getInstance()?.cleanup(),
		RedisClient.getInstance()?.cleanup(),
		(await getDBInstance(constants.dbLayer.currentDB))?.cleanup(),
	]);
}

export { type DBInstance, type ExecuteQueryType };
