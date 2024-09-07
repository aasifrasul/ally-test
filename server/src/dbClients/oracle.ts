import oracledb, { Pool, Connection, ResultSet } from 'oracledb';
import { constants } from '../constants';
import { logger } from '../Logger';

export default class OracleDBConnection {
	private static instance: OracleDBConnection;
	private pool!: Pool;
	private connection!: Connection;

	private constructor() {}

	public static async getInstance(): Promise<OracleDBConnection> {
		if (!(OracleDBConnection.instance instanceof OracleDBConnection)) {
			OracleDBConnection.instance = new OracleDBConnection();
			await OracleDBConnection.instance.createPool();
			logger.info(`OracleDBConnection instantiated.`);
		}

		return OracleDBConnection.instance;
	}

	private async createPool(): Promise<void> {
		try {
			this.pool = await oracledb.createPool(constants.dbLayer.oracle);
		} catch (err: unknown) {
			logger.warn(`Pool creation Error: ${(err as Error).stack}`);
		}
	}

	private async releaseConnection(): Promise<void> {
		if (this.connection) {
			try {
				await this.connection.release();
			} catch (err) {
				logger.error(err);
			}
		}
	}

	public async closePool(): Promise<void> {
		if (this.pool) {
			try {
				await this.pool.close();
				logger.info('Pool closed');
			} catch (err) {
				logger.error(`failed to close this.pool ${(err as Error).stack}`);
			}
		}
	}

	private async getConnection(): Promise<void> {
		try {
			this.connection = await this.pool.getConnection();
		} catch (err) {
			logger.error(`Pool failed to create Connection ${(err as Error).stack}`);
		}
	}

	public async executeQuery(query: string): Promise<any> {
		logger.info(`query -> ${query}`);
		await this.getConnection();

		try {
			const result = await this.connection.execute(query, [], {
				resultSet: true,
				outFormat: oracledb.OUT_FORMAT_OBJECT,
			});

			if (result.resultSet) {
				const rs: ResultSet<any> = result.resultSet;
				let row: any;
				const rows: any[] = [];
				while ((row = await rs.getRow())) {
					rows.push(row);
				}
				await rs.close();
				logger.info(`rows -> ${JSON.stringify(rows)}`);
				return rows;
			} else {
				await this.connection.commit();
				logger.info(`Result -> ${JSON.stringify(result)}`);
				return result.rowsAffected !== undefined && result.rowsAffected > 0
					? true
					: false;
			}
		} catch (err) {
			logger.warn(`Pool creation Error: ${(err as Error).stack}`);
		} finally {
			await this.releaseConnection();
		}
	}
}
