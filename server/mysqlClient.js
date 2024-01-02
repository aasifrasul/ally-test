const mysql = require('mysql');

const { logger } = require('./Logger');
const { safeStringify } = require('./helper');

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'test',
	password: 'test',
	database: `test`,
	port: 3306,
});

connection.connect((err) => {
	if (err) {
		logger.error('Database connection failed', safeStringify(err));
		return;
	}
	logger.info('Database connected');
});

const executeQuery = (query) =>
	new Promise((resolve, reject) => {
		connection.query(query, (err, result) => {
			err ? reject(err) : resolve(result);
		});
	});

module.exports = { executeQuery };
