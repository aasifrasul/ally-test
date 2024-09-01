const mysql = require('mysql2/promise');

const { constants } = require('../constants');

const { logger } = require('../Logger');

const {
	user,
	host,
	database,
	password,
	port,
	waitForConnections,
	connectionLimit,
	maxIdle,
	idleTimeout,
	queueLimit,
	enableKeepAlive,
	keepAliveInitialDelay,
	ssl,
} = constants.dbLayer.mysql;

class MysqlDBConnection {
	static async getInstance() {
		if (!(MysqlDBConnection.instance instanceof MysqlDBConnection)) {
			MysqlDBConnection.instance = new MysqlDBConnection();
			await MysqlDBConnection.instance.createPool();
			logger.info(`MysqlDBConnection instantiated`);
		}

		return MysqlDBConnection.instance;
	}

	async createPool() {
		try {
			this.pool = await mysql.createPool({
				user,
				host,
				database,
				password,
				port,
				waitForConnections,
				connectionLimit,
				maxIdle,
				idleTimeout,
				queueLimit,
				enableKeepAlive,
				keepAliveInitialDelay,
				ssl,
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
