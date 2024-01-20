const OracleDBConnection = require('./oracle');
const PostgresDBConnection = require('./postgresql');
const MysqlDBConnection = require('./mysql');

class GenericDBConnection {
	static instance;
	dbInstance;

	static async getInstance(type) {
		if (!(GenericDBConnection.instance instanceof GenericDBConnection)) {
			GenericDBConnection.instance = new GenericDBConnection();
			await GenericDBConnection.instance.createConnection(type);
		}

		return GenericDBConnection.instance;
	}

	async createConnection(type) {
		switch (type) {
			case 'oracle':
				this.dbInstance = OracleDBConnection.getInstance();
				return;
			case 'postgresql':
				this.dbInstance = PostgresDBConnection.getInstance();
				return;
			case 'mysql':
				this.dbInstance = MysqlDBConnection.getInstance();
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
