import oracledb, { Pool, Connection } from 'oracledb';
import { constants } from '../constants';
import { logger } from '../Logger';

interface ResultSet<T = any> {
	getRows(): Promise<T[]>;
	close(): Promise<void>;
}

interface ExecuteResult<T = any> {
	rows?: T[];
	outBinds?: any;
	rowsAffected?: number;
	resultSet?: ResultSet<T>;
}
class OracleDBConnection {
	private static instance: OracleDBConnection;
	private pool!: Pool;

	private constructor() {}

	public static async getInstance(): Promise<OracleDBConnection> {
		if (!OracleDBConnection.instance) {
			OracleDBConnection.instance = new OracleDBConnection();
			await OracleDBConnection.instance.createPool();
			logger.info('OracleDBConnection instantiated.');
		}
		return OracleDBConnection.instance;
	}

	private async createPool(): Promise<void> {
		try {
			this.pool = await oracledb.createPool(constants.dbLayer.oracle);
			logger.info('Pool created successfully.');
		} catch (err: unknown) {
			logger.error(`Pool creation Error: ${(err as Error).stack}`);
			throw err; // Re-throw the error to be handled by the caller
		}
	}

	public async executeQuery<T = any>(query: string): Promise<T[] | boolean> {
		logger.info(`Executing query: ${query}`);
		let connection: Connection | undefined;

		try {
			connection = await this.pool.getConnection();
			const result: ExecuteResult<T> = await connection.execute<T>(query, [], {
				resultSet: true,
				outFormat: oracledb.OUT_FORMAT_OBJECT,
			});

			if (result.resultSet) {
				const rows: T[] = await result.resultSet.getRows();
				await result.resultSet.close();
				logger.info(`Rows retrieved: ${rows.length}`);
				return rows;
			} else {
				await connection.commit();
				logger.info(`Rows affected: ${result.rowsAffected}`);
				return result.rowsAffected !== undefined && result.rowsAffected > 0;
			}
		} catch (err) {
			logger.error(`Query execution error: ${(err as Error).stack}`);
			throw err; // Re-throw the error to be handled by the caller
		} finally {
			if (connection) {
				try {
					await connection.close();
				} catch (err) {
					logger.error(`Error releasing connection: ${(err as Error).stack}`);
				}
			}
		}
	}

	// method for executing multiple queries in a transaction
	public async executeTransaction<T = any>(queries: string[]): Promise<(T[] | boolean)[]> {
		let connection: Connection | undefined;

		try {
			connection = await this.pool.getConnection();
			const results: (T[] | boolean)[] = [];

			for (const query of queries) {
				logger.info(`Executing query in transaction: ${query}`);
				const result = await connection.execute<T>(query, [], {
					resultSet: true,
					outFormat: oracledb.OUT_FORMAT_OBJECT,
				});

				if (result.resultSet) {
					const rows = await result.resultSet.getRows();
					await result.resultSet.close();
					results.push(rows);
				} else {
					results.push(result.rowsAffected !== undefined && result.rowsAffected > 0);
				}
			}

			await connection.commit();
			logger.info('Transaction committed successfully');
			return results;
		} catch (err) {
			if (connection) {
				await connection.rollback();
				logger.info('Transaction rolled back due to error');
			}
			logger.error(`Transaction execution error: ${(err as Error).stack}`);
			throw err;
		} finally {
			if (connection) {
				try {
					await connection.close();
				} catch (err) {
					logger.error(`Error releasing connection: ${(err as Error).stack}`);
				}
			}
		}
	}

	public async cleanup(): Promise<void> {
		if (this.pool) {
			try {
				await this.pool.close();
				logger.info('Pool closed');
			} catch (err) {
				logger.error(`Failed to close pool: ${(err as Error).stack}`);
				throw err; // Re-throw the error to be handled by the caller
			}
		}
	}
}

export default OracleDBConnection;
