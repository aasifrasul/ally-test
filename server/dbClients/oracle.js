const oracledb = require('oracledb');

const { logger } = require('../Logger');

let pool;

async function releaseConnection(connection) {
	if (connection) {
		try {
			await connection.release();
		} catch (err) {
			logger.error(err);
		}
	}
}

async function createPool() {
	try {
		pool = await oracledb.createPool({
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

createPool();

async function closePool() {
	if (pool) {
		try {
			await pool.close();
			logger.info('Pool closed');
		} catch (err) {
			logger.error(`failed to close pool ${err.stack}`);
		}
	}
}

async function executeQuery(query) {
	logger.info(`query -> ${query}`);
	let connection;

	try {
		connection = await pool.getConnection();
	} catch (err) {
		logger.error(`Pool failed to create Connection ${err.stack}`);
	}

	try {
		const result = await connection.execute(query, [], {
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
			connection.commit();
			logger.info(`Result -> ${JSON.stringify(result)}`);
			return result.rowsAffected > 0;
		}
	} catch (err) {
		logger.error(`executeQuery failed -> ${JSON.stringify(err.stack)}`);
	} finally {
		releaseConnection(connection);
	}
}

module.exports = { executeQuery, closePool };
