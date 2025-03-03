import { createClient, RedisClientType } from 'redis';
import { constants } from '../constants';
import { logger } from '../Logger';

const { url, MAX_RETRIES, RETRY_DELAY } = constants.cachingLayer.redisConfig;

export class RedisClient {
	private static instance: RedisClient;
	private client: RedisClientType | null = null;
	private connected: boolean = false;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private initializing: boolean = false;

	private constructor() {}

	public static getInstance() {
		if (RedisClient.instance) {
			return RedisClient.instance;
		}
		RedisClient.instance = new RedisClient();
		return RedisClient.instance;
	}

	public async connect(): Promise<void> {
		if (this.connected || this.initializing) {
			return; // Already connected or initializing, nothing to do
		}

		this.initializing = true;
		try {
			await this.connectWithRetry();
		} finally {
			this.initializing = false;
		}
	}

	private async connectWithRetry(): Promise<void> {
		try {
			this.client = createClient({
				url,
				socket: { reconnectStrategy: this.reconnectStrategy },
			});

			this.client.on('error', (err: Error) => {
				logger.error('Redis Client Error', err);
				this.connected = false;
			});

			this.client.on('connect', () => {
				logger.info('Redis client establishing connection...');
			});

			this.client.on('ready', () => {
				logger.info('Redis client ready for commands');
				this.connected = true;
			});

			this.client.on('reconnecting', () => {
				logger.info('Redis client attempting to reconnect...');
			});

			this.client.on('end', () => {
				logger.info('Redis client connection closed');
				this.connected = false;
			});

			await this.client.connect();
			this.connected = true;
		} catch (err) {
			logger.error('Redis connection attempt failed:', err); // err is now the error from reconnectStrategy
			this.connected = false; // Ensure connected is false if connection fails
		}
	}

	private reconnectStrategy = (retries: number): number | false | Error => {
		const maxReconnectAttempts = MAX_RETRIES ?? 5;

		if (retries >= maxReconnectAttempts) {
			logger.error(`Redis connection failed after ${maxReconnectAttempts} attempts`);
			return new Error('Max reconnection attempts reached'); // Return an error to stop retrying
		}

		const delay = Math.min(Math.pow(2, retries) * (RETRY_DELAY ?? 1000), 30000);
		logger.info(
			`Redis reconnect strategy delay: ${delay}ms, attempt: ${
				retries + 1
			}/${maxReconnectAttempts}`,
		);
		return delay;
	};

	public isReady(): boolean {
		return this.connected && this.client !== null;
	}

	public async cacheData(
		key: string,
		value: any,
		expirationSeconds: number = 3600,
	): Promise<boolean> {
		if (!this.isReady()) {
			logger.error('Redis client not connected. Unable to cache data.');
			return false;
		}

		try {
			await this.client!.set(key, JSON.stringify(value), {
				EX: expirationSeconds,
			});
			logger.debug(`Data cached successfully for key: ${key}`);
			return true;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to cache data: ${errorMessage}`);
			return false;
		}
	}

	public async getCachedData<T>(key: string): Promise<T | null> {
		if (!this.isReady()) {
			logger.error('Redis client not connected');
			return null;
		}

		try {
			const data = await this.client!.get(key);
			return data ? (JSON.parse(data) as T) : null;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to get cached data: ${errorMessage}`);
			return null;
		}
	}

	public async deleteCachedData(key: string): Promise<boolean> {
		if (!this.isReady()) {
			logger.error('Redis client not connected');
			return false;
		}

		try {
			await this.client!.del(key);
			logger.debug(`Data deleted successfully for key: ${key}`);
			return true;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to delete cached data: ${errorMessage}`);
			return false;
		}
	}

	public stopReconnection(): void {
		if (this.client) {
			this.client.quit(); // This will properly close the connection
		}
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
		logger.info('Redis reconnection attempts stopped.');
	}
}
