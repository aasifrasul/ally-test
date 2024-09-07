import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { constants } from '../constants';
import { logger } from '../Logger';

export default class PostgresDBConnection {
	private static instance: PostgresDBConnection;
	private pool: Pool;

	private constructor() {
		this.pool = new Pool(constants.dbLayer.postgres);

		this.pool.on('connect', () => {
			logger.info('PostgresDBConnection Pool connected');
		});

		this.pool.on('error', (err) => {
			logger.error(`Unexpected error on idle client: ${err.message}`);
		});

		this.pool.on('remove', () => {
			logger.info('PostgresDBConnection Pool connection removed');
		});
	}

	public static async getInstance(): Promise<PostgresDBConnection> {
		if (!PostgresDBConnection.instance) {
			PostgresDBConnection.instance = new PostgresDBConnection();
			await PostgresDBConnection.instance.testConnection();
			logger.info('PostgresDBConnection instantiated');
		}

		return PostgresDBConnection.instance;
	}

	private async testConnection(): Promise<void> {
		let client: PoolClient | null = null;
		try {
			client = await this.pool.connect();
			logger.info('PostgresDBConnection Pool has an active client');
		} catch (err) {
			logger.error(`PostgresDBConnection Pool creation Error: ${(err as Error).stack}`);
			throw err;
		} finally {
			if (client) client.release();
		}
	}

	public async cleanup(): Promise<void> {
		if (this.pool) {
			try {
				await this.pool.end();
				logger.info('PostgresDBConnection Pool closed');
			} catch (err) {
				logger.error(
					`PostgresDBConnection failed to close pool: ${(err as Error).stack}`,
				);
			}
		}
	}

	public async executeQuery<T extends QueryResultRow = QueryResultRow>(
		query: string,
		params?: any[],
	): Promise<T[]> {
		logger.info(`Executing query: ${query}`);
		logger.debug(`Query parameters: ${JSON.stringify(params)}`);

		let client: PoolClient | null = null;
		try {
			client = await this.pool.connect();
			const result: QueryResult<T> = await client.query(query, params);
			logger.debug(`Query returned ${result.rowCount} rows`);
			return result.rows;
		} catch (err) {
			logger.error(`PostgresDBConnection executeQuery failed: ${(err as Error).stack}`);
			throw err;
		} finally {
			if (client) client.release();
		}
	}
}
