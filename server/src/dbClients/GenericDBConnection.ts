import OracleDBConnection from './oracle';
import PostgresDBConnection from './postgresql';
import MysqlDBConnection from './mysql';
import { DBType } from '../types';
// import { MongoDBConnection } from './mongodb';

class GenericDBConnection {
	private static selfInstance: GenericDBConnection;
	private dbInstance:
		| OracleDBConnection
		| PostgresDBConnection
		| MysqlDBConnection
		| undefined;

	private constructor() {}

	public static async getInstance(type: DBType): Promise<GenericDBConnection> {
		if (!(GenericDBConnection.selfInstance instanceof GenericDBConnection)) {
			GenericDBConnection.selfInstance = new GenericDBConnection();
			await GenericDBConnection.selfInstance.createConnection(type);
		}

		return GenericDBConnection.selfInstance;
	}

	private async createConnection(type: DBType): Promise<void> {
		switch (type) {
			case 'oracle':
				this.dbInstance = await OracleDBConnection.getInstance();
				break;
			case 'postgres':
				this.dbInstance = await PostgresDBConnection.getInstance();
				break;
			case 'mysql':
				this.dbInstance = await MysqlDBConnection.getInstance();
				break;
			// case 'mongodb':
			//   this.dbInstance = await MongoDBConnection.getInstance();
			//   break;
			default:
				throw new Error(`Unsupported database type: ${type}`);
		}
	}

	public getDBInstance():
		| OracleDBConnection
		| PostgresDBConnection
		| MysqlDBConnection
		| undefined {
		return this.dbInstance;
	}
}

export { GenericDBConnection };
