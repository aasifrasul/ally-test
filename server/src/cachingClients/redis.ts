import { createClient, RedisClientType } from 'redis';
import { constants } from '../constants';
import { logger } from '../Logger';

const { url, MAX_RETRIES, RETRY_DELAY } = constants.cachingLayer.redisConfig;

export class RedisClient {
	private static instance: RedisClient;
	private client: RedisClientType | null = null;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private initializing: boolean = false;
	private subscriberClient: RedisClientType | null = null;
	private consecutiveFailures: number = 0;
	private readonly MAX_CONSECUTIVE_FAILURES = 2;
	private lastHealthCheck: Date | null = null;
	private isHealthy: boolean = false;
	private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

	private constructor() {}

	public static getInstance() {
		if (RedisClient.instance) {
			return RedisClient.instance;
		}
		RedisClient.instance = new RedisClient();
		return RedisClient.instance;
	}

	public async connect(): Promise<void> {
		if (this.isHealthy || this.initializing) {
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
				this.isHealthy = false;
				this.handleConnectionError(err);
			});

			this.client.on('connect', () => {
				logger.info('Redis client establishing connection...');
				this.consecutiveFailures = 0; // Reset on successful connection
				this.isHealthy = true;
			});

			this.client.on('ready', () => {
				logger.info('Redis client ready for commands');
				this.isHealthy = true;
				this.consecutiveFailures = 0;
			});

			this.client.on('reconnecting', () => {
				logger.info('Redis client attempting to reconnect...');
				this.isHealthy = false;
			});

			this.client.on('end', () => {
				logger.info('Redis client connection closed');
				this.isHealthy = false;
			});

			await this.client.connect();
			this.isHealthy = true;
		} catch (err) {
			logger.error('Redis connection attempt failed:', err);
			this.isHealthy = false;
			this.handleConnectionError(err as Error);
		}
	}

	private handleConnectionError(err: Error): void {
		this.consecutiveFailures++;
		this.isHealthy = false;

		const errorMessage = err.message.toLowerCase();
		const unavailableErrors = [
			'econnrefused',
			'enotfound',
			'etimedout',
			'connection refused',
			'host unreachable',
			'network unreachable',
		];

		const isUnavailableError = unavailableErrors.some((type) =>
			errorMessage.includes(type),
		);

		if (isUnavailableError && !this.isAvailable()) {
			logger.error(
				`Redis appears unavailable after ${this.consecutiveFailures} failures. ` +
					`Pausing retries until next reset.`,
			);
		}
	}

	/**
	 * Simplified reconnect strategy — only a few quick retries.
	 * Docker Compose handles full restart/recovery.
	 */
	private reconnectStrategy = (retries: number): number | false | Error => {
		const maxReconnectAttempts = Math.min(MAX_RETRIES ?? 2, 2);
		const baseDelay = RETRY_DELAY ?? 1000;

		// Stop retrying if Redis marked unavailable
		if (!this.isAvailable()) {
			logger.error('Redis unavailable — stopping retry loop.');
			return new Error('Redis server is unavailable');
		}

		if (retries >= maxReconnectAttempts) {
			logger.error(`Redis reconnect failed after ${maxReconnectAttempts} attempts.`);
			return new Error('Max reconnect attempts reached');
		}

		// small exponential backoff (1s → 2s → 4s max)
		const delay = Math.min(Math.pow(2, retries) * baseDelay, 4000);
		logger.info(
			`Redis reconnect delay: ${delay}ms (attempt ${retries + 1}/${maxReconnectAttempts})`,
		);
		return delay;
	};

	/**
	 * Performs a health check by executing a PING command
	 * Results are cached for HEALTH_CHECK_INTERVAL milliseconds
	 */
	public async checkHealth(): Promise<boolean> {
		const now = new Date();

		// Return cached result if recent
		if (
			this.lastHealthCheck &&
			now.getTime() - this.lastHealthCheck.getTime() < this.HEALTH_CHECK_INTERVAL
		) {
			return this.isHealthy;
		}

		// Check basic state first
		if (!this.isAvailable()) {
			this.isHealthy = false;
			return false;
		}

		try {
			// Perform actual PING to verify connection is responsive
			const response = await this.client?.ping();
			this.isHealthy = response === 'PONG';
			this.lastHealthCheck = now;

			if (this.isHealthy) {
				logger.debug('Redis health check passed');
			} else {
				logger.warn('Redis PING did not return PONG');
			}

			return this.isHealthy;
		} catch (error) {
			logger.error('Redis health check failed:', error);
			this.isHealthy = false;
			this.handleConnectionError(error as Error);
			return false;
		}
	}

	/**
	 * Quick synchronous check - does not perform actual PING
	 * @deprecated Use isAvailable() instead for better semantics
	 */
	public isReady(): boolean {
		return this.isAvailable();
	}

	/**
	 * Synchronous check of connection availability
	 * Returns true if connected and healthy, false otherwise
	 */
	public isAvailable(): boolean {
		return (
			this.isHealthy &&
			this.client !== null &&
			this.consecutiveFailures < this.MAX_CONSECUTIVE_FAILURES
		);
	}

	/**
	 * Get detailed connection status
	 */
	public getConnectionStatus(): {
		connected: boolean;
		healthy: boolean;
		unavailable: boolean;
		consecutiveFailures: number;
		lastHealthCheck: Date | null;
		initializing: boolean;
	} {
		return {
			connected: this.isHealthy,
			healthy: this.isHealthy,
			unavailable: !this.isAvailable(),
			consecutiveFailures: this.consecutiveFailures,
			lastHealthCheck: this.lastHealthCheck,
			initializing: this.initializing,
		};
	}

	/**
	 * Static method to check if Redis instance exists and is available
	 */
	public static isConnected(): boolean {
		return !!RedisClient.instance && RedisClient.instance.isAvailable();
	}

	/**
	 * Static async method to verify connection health with PING
	 */
	public static async isHealthy(): Promise<boolean> {
		if (!RedisClient.instance) return false;
		return await RedisClient.instance.checkHealth();
	}

	public async resetAvailabilityStatus(): Promise<void> {
		this.consecutiveFailures = 0;
		this.isHealthy = false;
		this.lastHealthCheck = null;
		logger.info('Redis availability status reset. Reconnection attempts can resume.');

		// Optionally perform immediate health check
		await this.checkHealth();
	}

	public async cacheData(
		key: string,
		value: any,
		expirationSeconds: number = 3600,
	): Promise<boolean> {
		if (!this.isAvailable()) {
			logger.warn('Redis is unavailable. Caching operation skipped.');
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
		if (!this.isAvailable()) {
			logger.warn('Redis is unavailable. Cache retrieval skipped.');
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
		if (!this.isAvailable()) {
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
		if (!this.isAvailable()) {
			logger.warn('Redis is unavailable. Message publishing skipped.');
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
		if (!this.isAvailable()) {
			logger.warn('Redis is unavailable. Job addition skipped.');
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
		if (!this.isAvailable()) {
			logger.warn('Redis is unavailable. Job processing skipped.');
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
		if (!this.isAvailable()) {
			logger.warn('Redis is unavailable. Cache deletion skipped.');
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
		this.consecutiveFailures = 0;
		this.isHealthy = false;
		logger.info('Redis reconnection attempts stopped.');
	}

	public async cleanup(): Promise<void> {
		if (this.isHealthy === false) return;
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
			this.isHealthy = false;
			this.lastHealthCheck = null;
			logger.info('Redis client disconnected successfully.');
		} catch (err) {
			logger.error('Error during Redis disconnect:', err);
		}
	}
}
