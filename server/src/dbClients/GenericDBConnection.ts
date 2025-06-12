import OracleDBConnection from './OracleDBConnection';
import { PostgresDBConnection, QueryResultRow } from './PostgresDBConnection';
import { MysqlDBConnection, RowDataPacket, ResultSetHeader } from './MysqlDBConnection';
import { DBType } from '../types';

export type DBInstance = OracleDBConnection | PostgresDBConnection | MysqlDBConnection | null;

export type ExecuteQueryType =
	| RowDataPacket[][]
	| RowDataPacket[]
	| ResultSetHeader
	| ResultSetHeader[]
	| QueryResultRow;

// import { MongoDBConnection } from './mongodb';

export class GenericDBConnection {
	private static selfInstance: GenericDBConnection;
	private dbInstance: DBInstance = null;

	private constructor(type: DBType) {
		this.createConnection(type);
	}

	public static async getInstance(type: DBType): Promise<GenericDBConnection> {
		if (!(GenericDBConnection.selfInstance instanceof GenericDBConnection)) {
			GenericDBConnection.selfInstance = new GenericDBConnection(type);
		}

		return GenericDBConnection.selfInstance;
	}

	private async createConnection(type: DBType): Promise<void> {
		switch (type) {
			case DBType.ORACLE:
				this.dbInstance = await OracleDBConnection.getInstance();
				break;
			case DBType.POSTGRES:
				this.dbInstance = await PostgresDBConnection.getInstance({});
				break;
			case DBType.MYSQL:
				this.dbInstance = await MysqlDBConnection.getInstance();
				break;
			// case 'mongodb':
			//   this.dbInstance = await MongoDBConnection.getInstance();
			//   break;
			default:
				throw new Error(`Unsupported database type: ${type}`);
		}
	}

	public async executeQuery<T extends ExecuteQueryType>(
		query: string,
		params?: any[],
	): Promise<T> {
		let rows: any;
		if (this.dbInstance instanceof PostgresDBConnection) {
			rows = await this.dbInstance.executeQuery<QueryResultRow>(query, params);
			// Handle PostgreSQL result
		} else if (this.dbInstance instanceof MysqlDBConnection) {
			rows = await this.dbInstance.executeQuery<any[]>(query, params);
			// Handle MySQL result
		} else if (this.dbInstance instanceof OracleDBConnection) {
			rows = await this.dbInstance.executeQuery<any>(query);
			// Handle Oracle result
		} else {
			throw new Error('Unsupported database instance');
		}
		return rows as T;
	}

	public getDBInstance(): DBInstance {
		return this.dbInstance;
	}

	public async cleanup(): Promise<void> {
		if (this.dbInstance) {
			this.dbInstance.cleanup();
		}
	}
}
