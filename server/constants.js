const constants = {
	cachingLayer: {
		enabled: true,
		redisConfig: {
			host: 'localhost',
			port: 6379,
			MAX_RETRIES: 5,
			RETRY_DELAY: 1000,
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
