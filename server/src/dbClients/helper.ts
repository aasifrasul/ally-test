import { Server } from 'http';
import { PostgresDBConnection, QueryResultRow } from './PostgresDBConnection';
import { logger } from '../Logger';
import { DBType } from '../types';
import {
	GenericDBConnection,
	type DBInstance,
	type ExecuteQueryType,
} from './GenericDBConnection';
import { RedisClient } from '../cachingClients/redis';
import { constants } from '../constants';
import { connectWSServer, disconnectWSServer } from '../webSocketConnection';
import { connectToIOServer, disconnectIOServer } from '../socketConnection';

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

export const getDBInstance = async (currentDB: DBType): Promise<GenericDBConnection> => {
	const genericInstance = await GenericDBConnection.getInstance(currentDB);

	if (!genericInstance) {
		throw new Error(`Failed to get DB instance for ${currentDB}`);
	}

	return genericInstance;
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

export async function initializeConnections(httpServer: Server): Promise<any> {
	return Promise.allSettled([
		getDBInstance(constants.dbLayer.currentDB),
		RedisClient.getInstance().connect(),
		connectWSServer(httpServer),
		connectToIOServer(httpServer),
	]);
}

export async function closeActiveConnections(): Promise<any> {
	return Promise.allSettled([
		(await getDBInstance(constants.dbLayer.currentDB))?.cleanup(),
		RedisClient.getInstance().cleanup(),
		disconnectIOServer(),
		disconnectWSServer(),
	]);
}

export { type DBInstance, type ExecuteQueryType };
