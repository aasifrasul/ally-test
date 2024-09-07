import mysql, {
	Pool,
	PoolConnection,
	RowDataPacket,
	OkPacket,
	ResultSetHeader,
} from 'mysql2/promise';
import { constants } from '../constants';
import { logger } from '../Logger';

class MysqlDBConnection {
	private static instance: MysqlDBConnection;
	private pool: Pool = {} as Pool;
	private connection: PoolConnection | null = null;

	private constructor() {}

	public static async getInstance(): Promise<MysqlDBConnection> {
		if (!(MysqlDBConnection.instance instanceof MysqlDBConnection)) {
			MysqlDBConnection.instance = new MysqlDBConnection();
			await MysqlDBConnection.instance.createPool();
			logger.info(`MysqlDBConnection instantiated`);
		}

		return MysqlDBConnection.instance;
	}

	private async createPool(): Promise<void> {
		try {
			this.pool = await mysql.createPool(constants.dbLayer.mysql);

			this.pool.on('acquire', (connection: PoolConnection) =>
				logger.info(`Connection ${connection.threadId} acquired`),
			);

			this.pool.on('connection', (connection: PoolConnection) =>
				logger.info(`Connection ${connection.threadId} established`),
			);

			this.pool.on('enqueue', () =>
				logger.info('Waiting for available connection slot'),
			);

			this.pool.on('release', (connection: PoolConnection) =>
				logger.info(`Connection ${connection.threadId} released`),
			);
		} catch (err) {
			logger.warn(`Pool creation Error: ${(err as Error).stack}`);
		}
	}

	public async releaseConnection(): Promise<void> {
		if (this.connection) {
			try {
				await this.pool.releaseConnection(this.connection);
			} catch (err) {
				// Log the error properly
				logger.error(`Failed to release connection: ${(err as Error).message}`);
			}
		}
	}

	public closePool(): void {
		if (this.pool) {
			this.pool
				.end()
				.then(() => {
					logger.info('All connections in the pool have ended');
				})
				.catch((err) => {
					logger.error(`Error closing pool: ${err.message}`);
				});
		}
	}

	private async getConnection(): Promise<void> {
		try {
			this.connection = await this.pool.getConnection();
			// Release the connection after use
			await this.pool.releaseConnection(this.connection);
		} catch (err) {
			logger.error(`Failed to get connection: ${(err as Error).message}`);
		}
	}

	public async executeQuery<
		T extends
			| RowDataPacket[][]
			| RowDataPacket[]
			| OkPacket
			| OkPacket[]
			| ResultSetHeader,
	>(query: string): Promise<T> {
		logger.info(`query -> ${query}`);

		let result: T;

		try {
			const [queryResult] = await this.pool.execute(query);
			result = queryResult as T;
			logger.info(`query result -> ${JSON.stringify(result)}`);
		} catch (err) {
			logger.info(`failed to execute query -> ${JSON.stringify((err as Error).stack)}`);
			throw err; // Re-throw the error after logging
		} finally {
			await this.releaseConnection();
		}

		return result;
	}
}

export default MysqlDBConnection;
