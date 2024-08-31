const redis = require('redis');

const { constants } = require('../constants');
const { logger } = require('../Logger');

let client;
let connected = false;

const { MAX_RETRIES, RETRY_DELAY } = constants.cachingLayer.redisConfig;

async function connectWithRetry(retries = 0) {
	try {
		client = redis.createClient();

		// client.on('error', (error) => logger.error(`\nRedis client Error : ${error}\n`));
		client.on('ready', () => logger.info('\nRedis client Ready\n'));
		client.on('connect', () => logger.info('\nRedis client connected\n'));

		await client.connect();
		logger.info('Redis client connected successfully');
	} catch (err) {
		logger.error(`Redis connection attempt ${retries + 1} failed: ${err.message}`);
		if (retries < MAX_RETRIES) {
			const delay = RETRY_DELAY * Math.pow(2, retries);
			logger.warn(`Retrying Redis connection in ${delay / 1000} seconds...`);
			await new Promise((resolve) => setTimeout(resolve, delay));
			await connectWithRetry(retries + 1);
		} else {
			logger.error('Max retries reached. Could not connect to Redis.');
			throw new AggregateError(
				[err],
				'Max retries reached. Could not connect to Redis.',
			);
		}
	}
}

(async () => {
	try {
		await connectWithRetry();
		connected = true;
	} catch (err) {
		logger.error(`Failed to connect to Redis: ${err.message}`);
	}
})();

async function cacheData(key, value) {
	if (!connected) {
		logger.error('Redis client not connected');
		return false;
	}

	try {
		await client.set(key, JSON.stringify(value), 'EX', 3600);
		logger.info(`Data cached successfully for key: ${key}`);
		return true;
	} catch (err) {
		logger.error(`Failed to cache data: ${err}`);
		return false;
	}
}

async function getCachedData(key) {
	if (!connected) {
		logger.error('Redis client not connected');
		return false;
	}

	try {
		const data = await client.get(key);
		logger.info(`Data fetched successfully for key: ${key} ${data}`);
		return data ? JSON.parse(data) : null;
	} catch (err) {
		logger.error(`Failed to get cached data: ${err}`);
		return null;
	}
}

async function deleteCachedData(key) {
	if (!connected) {
		logger.error('Redis client not connected');
		return false;
	}

	try {
		await client.del(key);
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
 * 

(async () => {
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

 *
*/
