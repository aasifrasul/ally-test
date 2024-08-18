const redis = require('redis');
const { logger } = require('../Logger');

let redisClient;

(async () => {
	redisClient = redis.createClient();

	redisClient.on('error', (error) => logger.error(`\nRedis client Error : ${error}\n`));

	redisClient.on('ready', () => logger.info('\nRedis client Ready\n'));

	redisClient.on('connect', () => logger.info('\nRedis client connected\n'));

	await redisClient.connect();
})();

async function cacheData(key, value) {
	await new Promise((resolve, reject) => {
		redisClient.set(key, JSON.stringify(value), 'EX', 3600, (err, data) => {
			if (err) {
				logger.error(`Failed to cache data: ${err}`);
				reject(err);
			} else {
				logger.info(`Data cached successfully for key: ${key}`);
				resolve(data);
			}
		});
	});
}

async function getCachedData(key) {
	await new Promise((resolve, reject) => {
		logger.info(`Inside Promise for key: ${key}`);
		redisClient.get(key, (err, data) => {
			logger.info(`Data  fetched successfully for key: ${key} ${data}`);
			if (err) {
				logger.error(`Failed to get cached data: ${err}`);
				reject(err);
			} else {
				logger.info(`Data retrieved successfully for key: ${key}`);
				resolve(data ? JSON.parse(data) : null);
			}
		});
	});
}

async function deleteCachedData(key) {
	await new Promise((resolve, reject) => {
		redisClient.del(key, (err, response) => {
			if (err) {
				logger.error(`\nFailed to delete cached data: ${err}\n`);
				reject(err);
			} else {
				resolve(response);
			}
		});
	});
}

// Example function to enqueue a task
async function enqueueTask(task) {
	// Assuming you have a mechanism to process tasks
	logger.info(`Enqueuing task: ${task}`);
}

module.exports = {
	cacheData,
	getCachedData,
	deleteCachedData,
	enqueueTask,
};

/**
 * 
 * (async () => {
	try {
		await getClient();
		await cacheData('exampleKey', { foo: 'bar' });
		const data = await getCachedData('exampleKey');
		logger.info(data);
		await enqueueTask('Example Task');
	} catch (err) {
		logger.error(err);
	}
})();
 */
