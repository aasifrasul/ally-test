import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { constants } from '../constants';
import { logger } from '../Logger';
import { IDBConnection } from './Adapters';

class MysqlDBConnection implements IDBConnection {
	private static instance: MysqlDBConnection;
	private pool: Pool;
	private lastHealthCheck: Date | null = null;
	private isHealthy: boolean = false;
	private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

	private constructor() {
		this.pool = mysql.createPool(constants.dbLayer.mysql);
		this.setupPoolListeners();
	}

	public static getInstance(): MysqlDBConnection {
		if (!MysqlDBConnection.instance) {
			MysqlDBConnection.instance = new MysqlDBConnection();
			logger.info('MysqlDBConnection instantiated');
		}
		return MysqlDBConnection.instance;
	}

	private setupPoolListeners(): void {
		this.pool.on('acquire', (connection: PoolConnection) =>
			logger.info(`Connection ${connection.threadId} acquired`),
		);
		this.pool.on('connection', (connection: PoolConnection) =>
			logger.info(`Connection ${connection.threadId} established`),
		);
		this.pool.on('enqueue', () => logger.info('Waiting for available connection slot'));
		this.pool.on('release', (connection: PoolConnection) =>
			logger.info(`Connection ${connection.threadId} released`),
		);
	}

	public async executeQuery<T = any>(
		query: string,
		params?: any[], // Add params parameter even if not used
	): Promise<T[]> {
		// Always return T[], not T[] | boolean
		logger.info(`Executing query: ${query}`);
		logger.info(`Query parameters: ${JSON.stringify(params)}`);

		let connection: PoolConnection | undefined;

		try {
			connection = await this.pool.getConnection();
			const result = await connection.execute(query, params);
			logger.info(`Query executed successfully`);
			logger.info(`Query result: ${JSON.stringify(result)}`);
			return result[0] as T[]; // Ensure array return
		} catch (error) {
			logger.error(`Failed to execute query: ${(error as Error).message}`);
			logger.info(`Error stack: ${(error as Error).stack}`);
			throw error;
		} finally {
			if (connection) {
				connection.release();
			}
		}
	}

	public async transaction<T>(
		callback: (connection: PoolConnection) => Promise<T>,
	): Promise<T> {
		const connection = await this.pool.getConnection();
		await connection.beginTransaction();

		try {
			const result = await callback(connection);
			await connection.commit();
			return result;
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
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

		if (!this.pool) {
			this.isHealthy = false;
			return false;
		}

		let client: PoolConnection | null = null;
		try {
			client = await this.pool.getConnection();
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
		return this.isHealthy;
	}

	public static async isConnected(): Promise<boolean> {
		if (!MysqlDBConnection.instance) return false;
		return await MysqlDBConnection.instance.checkHealth();
	}

	public async cleanup(): Promise<void> {
		try {
			await this.pool.end();
			logger.info('All connections in the pool have ended');
		} catch (error) {
			logger.error(`Error closing pool: ${(error as Error).message}`);
			throw error;
		}
	}
}

export { MysqlDBConnection, type RowDataPacket, type ResultSetHeader };
