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
	try {
		await redisClient.set(key, JSON.stringify(value), 'EX', 3600);
		logger.info(`Data cached successfully for key: ${key}`);
		return true;
	} catch (err) {
		logger.error(`Failed to cache data: ${err}`);
		return false;
	}
}

async function getCachedData(key) {
	try {
		const data = await redisClient.get(key);
		logger.info(`Data  fetched successfully for key: ${key} ${data}`);
		return data ? JSON.parse(data) : null;
	} catch (err) {
		logger.error(`Failed to get cached data: ${err}`);
		return null;
	}
}

async function deleteCachedData(key) {
	try {
		await redisClient.del(key);
		logger.info(`Data deleted successfully for key: ${key}`);
		return true;
	} catch (err) {
		logger.error(`Failed to delete cached data: ${err}`);
		return false;
	}
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
