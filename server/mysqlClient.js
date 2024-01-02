const mysql = require('mysql');

const { logger } = require('./Logger');

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'test',
	password: 'test',
	database: `test`,
	port: 3306,
});

connection.connect((err) => {
	if (err) {
		logger.error(JSON.stringify(err));
		return;
	}
	logger.log('Database connected');
});

module.exports = connection;
