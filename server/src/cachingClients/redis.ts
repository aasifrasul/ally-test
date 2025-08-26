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
	private subscriberClient: RedisClientType | null = null;
	private consecutiveFailures: number = 0;
	private readonly MAX_CONSECUTIVE_FAILURES = 3;
	private redisUnavailable: boolean = false;

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
				socket: {
					reconnectStrategy: this.reconnectStrategy,
					connectTimeout: 5000, // 5 second timeout
				},
			});

			this.client.on('error', (err: Error) => {
				logger.error('Redis Client Error', err);
				this.connected = false;
				this.handleConnectionError(err);
			});

			this.client.on('connect', () => {
				logger.info('Redis client establishing connection...');
				this.consecutiveFailures = 0; // Reset on successful connection
				this.redisUnavailable = false;
			});

			this.client.on('ready', () => {
				logger.info('Redis client ready for commands');
				this.connected = true;
				this.consecutiveFailures = 0;
				this.redisUnavailable = false;
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
			logger.error('Redis connection attempt failed:', err);
			this.connected = false;
			this.handleConnectionError(err as Error);
		}
	}

	private handleConnectionError(err: Error): void {
		this.consecutiveFailures++;

		// Check for specific error types that indicate Redis is unavailable
		const errorMessage = err.message.toLowerCase();
		const unavailableErrors = [
			'econnrefused',
			'enotfound',
			'etimedout',
			'connection refused',
			'host unreachable',
			'network unreachable',
		];

		const isUnavailableError = unavailableErrors.some((errorType) =>
			errorMessage.includes(errorType),
		);

		if (isUnavailableError && this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
			logger.error(
				`Redis appears to be unavailable after ${this.consecutiveFailures} consecutive failures. ` +
					`Stopping reconnection attempts. Error: ${err.message}`,
			);
			this.redisUnavailable = true;
		}
	}

	private reconnectStrategy = (retries: number): number | false | Error => {
		const maxReconnectAttempts = MAX_RETRIES ?? 5;

		// Stop retrying if Redis is deemed unavailable
		if (this.redisUnavailable) {
			logger.error('Redis is unavailable. Stopping reconnection attempts.');
			return new Error('Redis server is unavailable');
		}

		if (retries >= maxReconnectAttempts) {
			logger.error(`Redis connection failed after ${maxReconnectAttempts} attempts`);
			return new Error('Max reconnection attempts reached');
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
		if (!this.connected || this.client == null || this.redisUnavailable) {
			return false;
		}
		return true;
	}

	public isRedisAvailable(): boolean {
		return !this.redisUnavailable;
	}

	public async resetAvailabilityStatus(): Promise<void> {
		this.redisUnavailable = false;
		this.consecutiveFailures = 0;
		logger.info('Redis availability status reset. Reconnection attempts can resume.');
	}

	public async cacheData(
		key: string,
		value: any,
		expirationSeconds: number = 3600,
	): Promise<boolean> {
		if (!this.isReady()) {
			if (this.redisUnavailable) {
				logger.warn('Redis is unavailable. Caching operation skipped.');
			}
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
			this.handleConnectionError(err as Error);
			return false;
		}
	}

	public async getCachedData<T>(key: string): Promise<T | null> {
		if (!this.isReady()) {
			if (this.redisUnavailable) {
				logger.warn('Redis is unavailable. Cache retrieval skipped.');
			}
			return null;
		}

		try {
			const data = await this.client!.get(key);
			return data ? (JSON.parse(data) as T) : null;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to get cached data: ${errorMessage}`);
			this.handleConnectionError(err as Error);
			return null;
		}
	}

	async subscribeToChannel(channel: string) {
		if (this.redisUnavailable) {
			logger.warn('Redis is unavailable. Subscription skipped.');
			return false;
		}

		try {
			if (!this.subscriberClient) {
				this.subscriberClient = createClient({
					url,
					socket: { connectTimeout: 5000 },
				});
				await this.subscriberClient.connect();
			}
			await this.subscriberClient.subscribe(channel, (message) => {
				console.log(`Received: ${message} from ${channel}`);
			});
			return true;
		} catch (err) {
			logger.error(`Failed to subscribe to channel: ${err}`);
			this.handleConnectionError(err as Error);
			return false;
		}
	}

	async publishMessage(channel: string, message: string) {
		if (!this.isReady()) {
			if (this.redisUnavailable) {
				logger.warn('Redis is unavailable. Message publishing skipped.');
			}
			return false;
		}

		try {
			await this.client?.publish(channel, message);
			console.log(`Published: ${message} to ${channel}`);
			return true;
		} catch (err) {
			logger.error(`Failed to publish message: ${err}`);
			this.handleConnectionError(err as Error);
			return false;
		}
	}

	public stopSubscriberConnection(): void {
		if (this.subscriberClient) {
			this.subscriberClient.quit();
			this.subscriberClient = null;
		}
		logger.info('Redis subscriber connection stopped.');
	}

	async addJob(job: string) {
		if (!this.isReady()) {
			if (this.redisUnavailable) {
				logger.warn('Redis is unavailable. Job addition skipped.');
			}
			return false;
		}

		try {
			await this.client!.rPush('jobs', job);
			return true;
		} catch (err) {
			logger.error(`Failed to add job: ${err}`);
			this.handleConnectionError(err as Error);
			return false;
		}
	}

	async processJobs() {
		if (!this.isReady()) {
			if (this.redisUnavailable) {
				logger.warn('Redis is unavailable. Job processing skipped.');
			}
			return false;
		}

		try {
			while (true) {
				const job = await this.client!.lPop('jobs');
				if (job) {
					console.log('processing job: ', job);
					// process job.
				} else {
					break;
				}
			}
			return true;
		} catch (err) {
			logger.error(`Failed to process jobs: ${err}`);
			this.handleConnectionError(err as Error);
			return false;
		}
	}

	public async deleteCachedData(key: string): Promise<boolean> {
		if (!this.isReady()) {
			if (this.redisUnavailable) {
				logger.warn('Redis is unavailable. Cache deletion skipped.');
			}
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
			this.handleConnectionError(err as Error);
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
		this.redisUnavailable = false;
		this.consecutiveFailures = 0;
		logger.info('Redis reconnection attempts stopped.');
	}

	public async cleanup(): Promise<void> {
		if (this.connected === false) return;
		try {
			if (this.client) {
				await this.client.quit();
				this.client = null;
			}
			if (this.subscriberClient) {
				await this.subscriberClient.quit();
				this.subscriberClient = null;
			}
			if (this.reconnectTimeout) {
				clearTimeout(this.reconnectTimeout);
				this.reconnectTimeout = null;
			}
			this.connected = false;
			logger.info('Redis client disconnected successfully.');
		} catch (err) {
			logger.error('Error during Redis disconnect:', err);
		}
	}
}
