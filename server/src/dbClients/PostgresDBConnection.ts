import { Pool, PoolConfig, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { constants } from '../constants';
import { DBType } from '../types';
import { logger } from '../Logger';
import { IDBConnection } from './Adapters';

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
	public query: string;

	constructor(message: string, query: string) {
		super(message);
		this.query = query;
	}
}

export class PostgresDBConnection implements IDBConnection {
	private static instance: PostgresDBConnection;
	private pool: Pool;
	private isShuttingDown: boolean = false;
	private lastHealthCheck: Date | null = null;
	private isHealthy: boolean = false;
	private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

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
		PostgresDBConnection.checkForValidDBType();

		if (PostgresDBConnection.instance) return PostgresDBConnection.instance;

		PostgresDBConnection.instance = await PostgresDBConnection.createInstance(config);
		return PostgresDBConnection.instance;
	}

	private static async createInstance(
		config: PostgresDBConnectionConfig,
	): Promise<PostgresDBConnection> {
		try {
			const instance = new PostgresDBConnection(config);
			await instance.testConnection();
			logger.info('PostgresDBConnection instantiated');
			return instance;
		} catch (err) {
			throw new DatabaseConnectionError(
				`Failed to connect to database: ${(err as Error).message}`,
			);
		}
	}

	private static checkForValidDBType(): void {
		if (constants.dbLayer.currentDB !== DBType.POSTGRES) {
			throw new Error('Please use correct DB Type');
		}
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

	public async executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
		if (this.isShuttingDown) {
			throw new Error('Database connection is shutting down, no new queries allowed');
		}

		logger.info(`Executing query: ${query}`);
		logger.debug(`Query parameters: ${JSON.stringify(params)}`);

		let client: PoolClient | null = null;
		try {
			client = await this.pool.connect();
			const result: QueryResult = await client.query(query, params);
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
		await this.executeQuery(`CREATE TABLE IF NOT EXISTS users (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			"password" VARCHAR(255) NOT NULL,
			"name" VARCHAR(255) NOT NULL,
			"email" VARCHAR(255) NOT NULL,
			age INTEGER
		);`);
		await this.executeQuery(`CREATE TABLE IF NOT EXISTS products (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			category VARCHAR(255) NOT NULL
		);`);
	}

	public async checkHealth(): Promise<boolean> {
		const now = new Date();

		// Return cached result if recent
		if (
			this.lastHealthCheck &&
			now.getTime() - this.lastHealthCheck.getTime() < this.HEALTH_CHECK_INTERVAL
		) {
			return this.isHealthy;
		}

		if (this.isShuttingDown || !this.pool) {
			this.isHealthy = false;
			return false;
		}

		let client: PoolClient | null = null;
		try {
			client = await this.pool.connect();
			await client.query('SELECT 1');
			this.isHealthy = true;
			this.lastHealthCheck = now;
			return true;
		} catch (err) {
			logger.error(`Health check failed: ${(err as Error).message}`);
			this.isHealthy = false;
			return false;
		} finally {
			if (client) client.release();
		}
	}

	public isAvailable(): boolean {
		// Synchronous check for quick access
		return this.isHealthy && !this.isShuttingDown;
	}

	public static async isConnected(): Promise<boolean> {
		if (!PostgresDBConnection.instance) return false;
		return await PostgresDBConnection.instance.checkHealth();
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
