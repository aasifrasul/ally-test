import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { constants } from '../constants';
import { logger } from '../Logger';

class MysqlDBConnection {
	private static instance: MysqlDBConnection;
	private pool: Pool;

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

	public async executeQuery<
		T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader | ResultSetHeader[],
	>(query: string, params?: any[]): Promise<T> {
		logger.info(`Executing query: ${query}`);
		logger.info(`Query parameters: ${JSON.stringify(params)}`);

		let connection: PoolConnection | undefined;

		try {
			connection = await this.pool.getConnection();
			const [result] = await connection.execute(query, params);
			logger.info(`Query executed successfully`);
			logger.info(`Query result: ${JSON.stringify(result)}`);
			return result as T;
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
