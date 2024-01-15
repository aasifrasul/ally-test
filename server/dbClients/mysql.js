const mysql = require('mysql2/promise');

const { logger } = require('../Logger');

class MysqlDBConnection {
	static getInstance() {
		if (!(MysqlDBConnection.instance instanceof MysqlDBConnection)) {
			MysqlDBConnection.instance = new MysqlDBConnection();
			MysqlDBConnection.instance.createPool();
			logger.info(`MysqlDBConnection instantiated`);
		}

		return MysqlDBConnection.instance;
	}

	createPool() {
		try {
			this.pool = mysql.createPool({
				user: 'test',
				password: 'test',
				connectString: 'jdbc:mysql://127.0.0.1:3306/test',
				waitForConnections: true,
				connectionLimit: 10,
				maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
				idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
				queueLimit: 0,
				enableKeepAlive: true,
				keepAliveInitialDelay: 0,
				ssl: false,
			});

			this.pool.on('acquire', ({ threadId }) =>
				logger.info(`Connection ${threadId} acquired`),
			);

			this.pool.on('connection', ({ threadId }) =>
				logger.info(`Connection ${threadId} established`),
			);

			this.pool.on('enqueue', () =>
				logger.info('Waiting for available connection slot'),
			);

			this.pool.on('release', ({ threadId }) =>
				logger.info(`Connection ${threadId} released`),
			);
		} catch (err) {
			logger.warn(`Pool creation Error: ${err.stack}`);
		}
	}

	async releaseConnection() {
		if (this.connection) {
			try {
				await this.pool.releaseConnection(this.connection);
			} catch (err) {
				logger.warn(`connection failed to release -> : ${err.stack}`);
			}
		}
	}

	closePool() {
		if (this.pool) {
			this.pool.end((err) =>
				logger.info(`all connections in the pool have ended ${err}`),
			);
		}
	}

	async getConnection() {
		try {
			this.connection = await this.pool.getConnection();
		} catch (err) {
			logger.error(`Pool failed to create Connection ${err.stack}`);
		}
	}

	async executeQuery(query) {
		logger.info(`query -> ${query}`);
		/*
		if (this.pool._closed) {
			logger.info(`Pool is closed creating again`);
			this.createPool();
		}

		await this.getConnection();
*/

		let rows;

		try {
			[rows] = await this.pool.execute(query);
			logger.info(`fetched rows -> ${JSON.stringify(rows)}`);
		} catch (err) {
			logger.info(`failed to execute query -> ${JSON.stringify(err.stack)}`);
		} finally {
			this.releaseConnection();
		}

		return rows;
	}
}

module.exports = MysqlDBConnection;
