const OracleDBConnection = require('./oracle');
const PostgresDBConnection = require('./postgresql');
const MysqlDBConnection = require('./mysql');
// const MongoDBConnection = require('./mongodb');

class GenericDBConnection {
	static selfInstance;
	dbInstance;

	static async getInstance(type) {
		if (!(GenericDBConnection.selfInstance instanceof GenericDBConnection)) {
			GenericDBConnection.selfInstance = new GenericDBConnection();
			await GenericDBConnection.selfInstance.createConnection(type);
		}

		return GenericDBConnection.selfInstance;
	}

	async createConnection(type) {
		switch (type) {
			case 'oracle':
				this.dbInstance = await OracleDBConnection.getInstance();
				return;
			case 'postgresql':
				this.dbInstance = await PostgresDBConnection.getInstance();
				return;
			case 'mysql':
				this.dbInstance = await MysqlDBConnection.getInstance();
				return;
			default:
				return null;
		}
	}

	getDBInstance() {
		return this.dbInstance;
	}

	static async cleanup() {
		this.dbInstance = GenericDBConnection.getInstance();
		if (this.dbInstance?.cleanup) {
			await this.dbInstance?.cleanup();
		}
	}
}

module.exports = GenericDBConnection;
