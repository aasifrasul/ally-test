import { createClient, RedisClientType } from 'redis';
import { constants } from '../constants';
import { logger } from '../Logger';

class RedisClient {
	private client: RedisClientType | null = null;
	private connected: boolean = false;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private reconnectAttempts: number = 0;

	constructor() {
		this.connect();
	}

	public async connect(): Promise<void> {
		if (!this.connected) {
			await this.connectWithRetry();
		}
	}

	private async connectWithRetry(): Promise<void> {
		try {
			const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
			logger.info(`Attempting to connect to Redis at ${redisUrl}`);

			this.client = createClient({
				url: redisUrl,
			});

			/*
			this.client.on('error', (err) => {
				logger.error('Redis Client Error', err);
				if (err.code === 'ECONNREFUSED') {
					this.handleConnectionRefused();
				}
			});
			*/

			await this.client.connect();

			logger.info('Redis client connected successfully');
			this.connected = true;
		} catch (err) {
			if (err instanceof Error && 'code' in err && err?.code === 'ECONNREFUSED') {
				this.handleConnectionRefused();
			} else {
				logger.error(
					`Redis connection attempt failed:`,
					err instanceof Error ? err.stack : 'Unknown error',
				);
				this.attemptReconnect();
			}
		}
	}

	private handleConnectionRefused(): void {
		logger.error(
			'Connection to Redis server refused. Please check if Redis is running and accessible.',
		);
		this.attemptReconnect();
	}

	private attemptReconnect(): void {
		this.reconnectAttempts++;
		const maxReconnectAttempts = constants.cachingLayer.redisConfig?.MAX_RETRIES ?? 5;

		if (this.reconnectAttempts < maxReconnectAttempts) {
			const delay = constants.cachingLayer.redisConfig?.RETRY_DELAY ?? 1000;
			logger.error(
				`Retrying Redis connection in ${delay / 1000} seconds... (Attempt ${
					this.reconnectAttempts
				} of ${maxReconnectAttempts})`,
			);
			this.reconnectTimeout = setTimeout(
				() => this.connectWithRetry(),
				Math.pow(2, this.reconnectAttempts) * delay,
			);
		} else {
			logger.error(
				`Max reconnection attempts (${maxReconnectAttempts}) reached. Stopping reconnection attempts.`,
			);
			this.stopReconnection();
		}
	}

	public stopReconnection(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
		logger.info('Redis reconnection attempts stopped.');
	}

	// ... other methods remain the same ...

	public async cacheData(
		key: string,
		value: any,
		expirationSeconds: number = 3600,
	): Promise<boolean> {
		if (!this.connected || !this.client) {
			logger.error('Redis client not connected. Unable to cache data.');
			return false;
		}

		try {
			await this.client.set(key, JSON.stringify(value), {
				EX: expirationSeconds,
			});
			logger.info(`Data cached successfully for key: ${key}`);
			return true;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? (err as Error).message : 'An unknown error occurred';
			logger.error(`Failed to cache data: ${errorMessage}`);
			return false;
		}
	}

	public async getCachedData(key: string): Promise<any | null> {
		if (!this.connected) {
			logger.error('Redis client not connected');
			return null;
		}

		try {
			const data = await this.client?.get(key);
			return data ? JSON.parse(data) : null;
		} catch (err: unknown) {
			let errorMessage: string = `Failed to get cached data: ${(err as Error).message}`;
			logger.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	public async deleteCachedData(key: string): Promise<boolean> {
		if (!this.connected) {
			logger.error('Redis client not connected');
			return false;
		}

		try {
			await this.client?.del(key);
			logger.info(`Data deleted successfully for key: ${key}`);
			return true;
		} catch (err: unknown) {
			let errorMessage: string = `Failed to delete cached data: ${
				(err as Error).message
			}`;
			logger.error(errorMessage);
			throw new Error(errorMessage);
		}
	}
}

export default new RedisClient();
