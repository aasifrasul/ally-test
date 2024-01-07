const oracledb = require('oracledb');

const { logger } = require('../Logger');

class OracleDBConnection {
	static getInstance() {
		if (!(OracleDBConnection.instance instanceof OracleDBConnection)) {
			OracleDBConnection.instance = new OracleDBConnection();
			OracleDBConnection.instance.createPool();
			logger.info(
				`OracleDBConnection instantiated ${JSON.stringify(
					OracleDBConnection.instance,
				)}`,
			);
		}

		return OracleDBConnection.instance;
	}

	async createPool() {
		try {
			this.pool = await oracledb.createPool({
				user: 'zportal',
				password: 'zportal',
				connectString: 'dft11-t13-adb01.lab.nordigy.ru:1521/devf13ams_db',
				poolMin: 10,
				poolMax: 50,
				poolIncrement: 5,
				poolTimeout: 60,
			});
		} catch (err) {
			logger.warn(`Pool creation Error: ${err.stack}`);
		}
	}

	async releaseConnection() {
		if (this.connection) {
			try {
				await this.connection.release();
			} catch (err) {
				logger.error(err);
			}
		}
	}

	async closePool() {
		if (this.pool) {
			try {
				await this.pool.close();
				logger.info('Pool closed');
			} catch (err) {
				logger.error(`failed to close this.pool ${err.stack}`);
			}
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
		await this.getConnection();

		try {
			const result = await this.connection.execute(query, [], {
				resultSet: true,
				outFormat: oracledb.OUT_FORMAT_OBJECT,
			});

			if (result.resultSet) {
				const rs = result.resultSet;
				let row,
					rows = [];
				while ((row = await rs.getRow())) {
					rows.push(row);
				}
				await rs.close();
				logger.info(`rows -> ${JSON.stringify(rows)}`);
				return rows;
			} else {
				this.connection.commit();
				logger.info(`Result -> ${JSON.stringify(result)}`);
				return result.rowsAffected > 0;
			}
		} catch (err) {
			logger.error(`executeQuery failed -> ${JSON.stringify(err.stack)}`);
		} finally {
			this.releaseConnection();
		}
	}
}

module.exports = OracleDBConnection;
