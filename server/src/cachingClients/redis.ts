import { createClient } from 'redis';
import { constants } from '../constants';

class RedisClient {
	private client: any | null = null;
	private connected: boolean = false;

	constructor() {
		this.connect();
	}

	private async connectWithRetry(retries: number = 0): Promise<void> {
		try {
			this.client = createClient();

			this.client.on('ready', () => console.log('\nRedis client Ready'));
			this.client.on('connect', () => console.log('\nRedis client connected'));

			await this.client.connect();
			console.log('Redis client connected successfully');
			this.connected = true;
		} catch (err) {
			console.error(
				`Redis connection attempt ${retries + 1} failed: ${(err as Error).message}`,
			);
			if (retries < (constants.cachingLayer.redisConfig?.MAX_RETRIES ?? 0)) {
				const delay =
					(constants.cachingLayer.redisConfig?.RETRY_DELAY ?? 0) *
					Math.pow(2, retries);
				console.warn(`Retrying Redis connection in ${delay / 1000} seconds...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
				await this.connectWithRetry(retries + 1);
			} else {
				console.error('Max retries reached. Could not connect to Redis.');
				throw new Error('Max retries reached. Could not connect to Redis.');
			}
		}
	}

	public async connect(): Promise<void> {
		if (!this.connected) {
			await this.connectWithRetry();
		}
	}

	public async cacheData(key: string, value: any): Promise<boolean> {
		if (!this.connected) {
			console.error('Redis client not connected');
			return false;
		}

		try {
			await this.client.set(key, JSON.stringify(value), 'EX', 3600);
			console.log(`Data cached successfully for key: ${key}`);
			return true;
		} catch (err) {
			console.error(`Failed to cache data: ${err}`);
			return false;
		}
	}

	public async getCachedData(key: string): Promise<any | null> {
		if (!this.connected) {
			console.error('Redis client not connected');
			return null;
		}

		try {
			const data = await this.client.get(key);
			console.log(`Data fetched successfully for key: ${key} ${data}`);
			return data ? JSON.parse(data) : null;
		} catch (err) {
			console.error(`Failed to get cached data: ${err}`);
			return null;
		}
	}

	public async deleteCachedData(key: string): Promise<boolean> {
		if (!this.connected) {
			console.error('Redis client not connected');
			return false;
		}

		try {
			await this.client.del(key);
			console.log(`Data deleted successfully for key: ${key}`);
			return true;
		} catch (err) {
			console.error(`Failed to delete cached data: ${err}`);
			return false;
		}
	}
}

export default new RedisClient();
