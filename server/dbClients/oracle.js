const oracledb = require('oracledb');

const { logger } = require('../Logger');

async function createConnection() {
	let connection;

	try {
		connection = await oracledb.getConnection({
			user: 'zportal',
			password: 'zportal',
			connectionString: 'dft11-t13-adb01.lab.nordigy.ru:1521/devf13ams_db',
		});
		logger.info('Successfully connected to Oracle Database');
	} catch (err) {
		logger.warn(`Database connection Error: ${err.stack}`);
	}

	return connection;
}

async function closeConnection(connection) {
	if (connection) {
		try {
			await connection.close();
		} catch (err) {
			logger.error(err);
		}
	}
}

async function executeQuery(query) {
	logger.info(`query -> ${query}`);
	const connection = await createConnection();
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
		closeConnection(connection);
	}
}

module.exports = { executeQuery };
