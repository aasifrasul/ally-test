const { Pool } = require('pg');
const { logger } = require('../Logger');

class PostgresDBConnection {
	static instance;

	static getInstance() {
		if (!(PostgresDBConnection.instance instanceof PostgresDBConnection)) {
			PostgresDBConnection.instance = new PostgresDBConnection();
			PostgresDBConnection.instance.createPool();
			logger.info('PostgresDBConnection instantiated');
		}

		return PostgresDBConnection.instance;
	}

	async createPool() {
		try {
			this.pool = new Pool({
				user: 'postgres',
				host: 'localhost',
				database: 'postgres',
				password: 'test',
				port: 5432,
				// Additional pool options can be set here
			});

			this.pool.on('connect', () => {
				logger.info('PostgresDBConnection Pool connected');
			});

			this.pool.on('remove', () => {
				logger.info('PostgresDBConnection Pool connection removed');
			});

			// Check if the pool is connected by getting a client
			const client = await this.pool.connect();
			logger.info('PostgresDBConnection Pool has an active client');
			client.release();
		} catch (err) {
			logger.error(`PostgresDBConnection Pool creation Error: ${err.stack}`);
		}
	}

	async closePool() {
		if (this.pool) {
			try {
				await this.pool.end();
				logger.info('PostgresDBConnection Pool closed');
			} catch (err) {
				logger.error(`PostgresDBConnection failed to close pool ${err.stack}`);
			}
		}
	}

	async executeQuery(query) {
		logger.info(`query -> ${query}`);
		let client;

		try {
			client = await this.pool.connect();
			const result = await client.query(query);
			logger.info(`rows -> ${JSON.stringify(result.rows)}`);
			return result.rows;
		} catch (err) {
			logger.error(
				`PostgresDBConnection executeQuery failed -> ${JSON.stringify(err.stack)}`,
			);
			throw err;
		} finally {
			if (client) {
				client.release();
			}
		}
	}
}

module.exports = PostgresDBConnection;
