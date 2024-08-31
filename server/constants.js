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
	},
};

module.exports = { constants };
