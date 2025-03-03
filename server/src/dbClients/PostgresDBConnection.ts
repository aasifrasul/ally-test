import { Pool, PoolConfig, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { constants } from '../constants';
import { logger } from '../Logger';

export interface PostgresDBConnectionConfig extends PoolConfig {
	maxConnections?: number;
	connectionTimeoutMillis?: number;
}

export class DatabaseConnectionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DatabaseConnectionError';
	}
}

export class QueryExecutionError extends Error {
	constructor(message: string, query: string) {
		super(message);
		this.name = 'QueryExecutionError';
		this.query = query;
	}

	public get query(): string {
		return this.query;
	}

	public set query(value: string) {
		this.query = value;
	}
}

export class PostgresDBConnection {
	private static instance: PostgresDBConnection;
	private pool: Pool;
	private isShuttingDown: boolean = false;

	private constructor(config: PostgresDBConnectionConfig) {
		this.pool = new Pool({
			...constants.dbLayer.postgres,
			max: config.maxConnections || 20, // Default max connections
			connectionTimeoutMillis: config.connectionTimeoutMillis || 10000, // Default timeout
			...config,
		});

		this.pool.on('connect', () => {
			logger.info('PostgresDBConnection Pool connected');
		});

		this.pool.on('error', (err) => {
			logger.error(`Unexpected error on idle client: ${err.message}`);
		});

		this.pool.on('remove', () => {
			logger.info('PostgresDBConnection Pool connection removed');
		});

		// this.setupTables();
	}

	public static async getInstance(
		config: PostgresDBConnectionConfig,
	): Promise<PostgresDBConnection> {
		if (!PostgresDBConnection.instance) {
			PostgresDBConnection.instance = new PostgresDBConnection(config);
			try {
				await PostgresDBConnection.instance.testConnection();
				logger.info('PostgresDBConnection instantiated');
			} catch (err) {
				PostgresDBConnection.instance = undefined as any; // Reset instance on failure
				throw new DatabaseConnectionError(
					`Failed to connect to database: ${(err as Error).message}`,
				);
			}
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

	public async executeQuery<T extends QueryResultRow = QueryResultRow>(
		query: string,
		params?: any[],
	): Promise<T[]> {
		if (this.isShuttingDown) {
			throw new Error('Database connection is shutting down, no new queries allowed');
		}

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
			throw new QueryExecutionError(
				`Failed to execute query: ${(err as Error).message}`,
				query,
			);
		} finally {
			if (client) client.release();
		}
	}

	public async setupTables(): Promise<void> {
		await this.executeQuery(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
		await this.executeQuery(`CREATE TABLE IF NOT EXISTS TEST_USERS (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			"first_name" VARCHAR(255) NOT NULL,
			"last_name" VARCHAR(255) NOT NULL,
			age INTEGER
		);`);
		await this.executeQuery(`CREATE TABLE IF NOT EXISTS TEST_PRODUCTS (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			category VARCHAR(255) NOT NULL
		);`);
	}

	public async cleanup(): Promise<void> {
		this.isShuttingDown = true;
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
}

export type { QueryResultRow };
