const { post } = require('cypress/types/jquery');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { REDIS_MAX_RETRIES, REDIS_RETRY_DELAY } = process.env;

const constants = {
	cachingLayer: {
		enabled: true,
		redisConfig: {
			host: 'localhost',
			port: 6379,
			MAX_RETRIES: REDIS_MAX_RETRIES,
			RETRY_DELAY: REDIS_RETRY_DELAY,
		},
	},
	dbLayer: {
		currentDB: 'mongodb',
		mongodb: {
			uri: 'mongodb://localhost:27017',
		},
		postgres: {
			user: 'postgres',
			host: 'localhost',
			database: 'postgres',
			password: 'test',
			port: 5432,
		},
		mysql: {
			user: 'test',
			password: 'test',
			//connectString: 'jdbc:mysql://127.0.0.1:3306/test',
			host: `127.0.0.1`,
			port: 3306,
			database: 'test',
			waitForConnections: true,
			connectionLimit: 10,
			maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
			idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
			queueLimit: 0,
			enableKeepAlive: true,
			keepAliveInitialDelay: 0,
			ssl: false,
		},
		oracle: {
			user: 'zportal',
			password: 'zportal',
			connectString: 'dft11-t13-adb01.lab.nordigy.ru:1521/devf13ams_db',
			poolMin: 10,
			poolMax: 50,
			poolIncrement: 5,
			poolTimeout: 60,
		},
	},
};

module.exports = { constants };
