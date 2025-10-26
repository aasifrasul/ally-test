import { DBType } from '../types';
import { MongoDBAdapter, SQLAdapter, IDBAdapter } from './Adapters';
import {
	MongoDBConnection,
	MysqlDBConnection,
	OracleDBConnection,
	PostgresDBConnection,
} from '.';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { QueryResultRow } from 'pg';

export type DBInstance = OracleDBConnection | PostgresDBConnection | MysqlDBConnection | null;

export type ExecuteQueryType =
	| RowDataPacket[][]
	| RowDataPacket[]
	| ResultSetHeader
	| ResultSetHeader[]
	| QueryResultRow;

export class GenericDBConnection {
	private static instance: GenericDBConnection;
	private adapter: IDBAdapter | null = null;

	private constructor(type: DBType) {}

	public static async getInstance(type: DBType): Promise<GenericDBConnection> {
		if (!GenericDBConnection.instance) {
			GenericDBConnection.instance = new GenericDBConnection(type);
			await GenericDBConnection.instance.createConnection(type);
		}
		return GenericDBConnection.instance;
	}

	private async createConnection(type: DBType): Promise<void> {
		switch (type) {
			case DBType.POSTGRES: {
				const conn = await PostgresDBConnection.getInstance({});
				this.adapter = new SQLAdapter(conn);
				break;
			}
			case DBType.MYSQL: {
				const conn = await MysqlDBConnection.getInstance();
				this.adapter = new SQLAdapter(conn);
				break;
			}
			case DBType.ORACLE: {
				const conn = await OracleDBConnection.getInstance();
				this.adapter = new SQLAdapter(conn);
				break;
			}
			case DBType.MONGODB: {
				const conn = MongoDBConnection.getInstance();
				if (!conn) throw new Error('MongoDB not configured');
				await conn.connect();
				this.adapter = new MongoDBAdapter(conn);
				break;
			}
			default:
				throw new Error(`Unsupported database type: ${type}`);
		}
	}

	// Unified interface
	public async find<T>(collection: string, filter: any = {}): Promise<T[]> {
		if (!this.adapter) throw new Error('Database not initialized');
		return await this.adapter.find<T>(collection, filter);
	}

	public async findOne<T>(collection: string, filter: any): Promise<T | null> {
		if (!this.adapter) throw new Error('Database not initialized');
		return await this.adapter.findOne<T>(collection, filter);
	}

	public async insert<T>(collection: string, data: any): Promise<T> {
		if (!this.adapter) throw new Error('Database not initialized');
		return await this.adapter.insert<T>(collection, data);
	}

	public async update(collection: string, filter: any, data: any): Promise<number> {
		if (!this.adapter) throw new Error('Database not initialized');
		return await this.adapter.update(collection, filter, data);
	}

	public async delete(collection: string, filter: any): Promise<number> {
		if (!this.adapter) throw new Error('Database not initialized');
		return await this.adapter.delete(collection, filter);
	}

	public getAdapter(): IDBAdapter | null {
		return this.adapter;
	}

	public async cleanup(): Promise<void> {
		if (this.adapter) {
			await this.adapter.cleanup();
		}
	}
}
