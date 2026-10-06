import { Application } from 'express';

import { PostgresDBConnection } from '../dbClients/PostgresDBConnection';
import { MongoDBConnection } from '../dbClients/MongoDBConnection';
import { RedisClient } from '../cachingClients/redis';

export function registerHealthCheck(app: Application): void {
	app.get('/health', async (_, res) => {
		const mongoHealthy = await MongoDBConnection.isAvailable();
		const postgresHealthy = await PostgresDBConnection.isConnected();
		const redisHealthy = RedisClient.getInstance().isAvailable();
		const status =
			postgresHealthy || mongoHealthy || redisHealthy ? 'healthy' : 'unhealthy';

		res.status(status === 'healthy' ? 200 : 503).json({
			status,
			postgresHealthy,
			mongoHealthy,
			redisHealthy,
		});
	});
}
