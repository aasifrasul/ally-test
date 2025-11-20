import { createClient, RedisClientType } from 'redis';
import { constants } from '../constants';
import { logger } from '../Logger';

const { url, MAX_RETRIES, RETRY_DELAY } = constants.cachingLayer.redisConfig;

export class RedisClient {
	private static instance: RedisClient;
	private client: RedisClientType | null = null;
	private subscriberClient: RedisClientType | null = null;
	private isConnected: boolean = false;
	private isConnecting: boolean = false;

	private constructor() {}

	public static getInstance(): RedisClient {
		if (!RedisClient.instance) {
			RedisClient.instance = new RedisClient();
		}
		return RedisClient.instance;
	}

	/**
	 * Connect to Redis with proper error handling
	 */
	public async connect(): Promise<void> {
		// Already connected
		if (this.isConnected && this.client?.isOpen) {
			logger.debug('Redis already connected');
			return;
		}

		// Already attempting to connect
		if (this.isConnecting) {
			logger.debug('Redis connection already in progress');
			return;
		}

		this.isConnecting = true;

		try {
			logger.info(`Connecting to Redis: ${url.replace(/:[^:@]+@/, ':****@')}`);

			// Create new client
			this.client = createClient({
				url,
				socket: {
					connectTimeout: 10000,
					reconnectStrategy: (retries) => {
						// Limit reconnection attempts
						if (retries > (MAX_RETRIES || 5)) {
							logger.error(
								`Redis reconnection failed after ${retries} attempts`,
							);
							return new Error('Max reconnection attempts reached');
						}

						const delay = Math.min(retries * (RETRY_DELAY || 1000), 5000);
						logger.info(
							`Redis reconnecting in ${delay}ms (attempt ${retries + 1})`,
						);
						return delay;
					},
				},
			});

			// Set up event handlers
			this.setupEventHandlers();

			// Attempt connection
			await this.client.connect();

			// Verify with PING
			const pong = await this.client.ping();
			if (pong !== 'PONG') {
				throw new Error('Redis PING failed');
			}

			this.isConnected = true;
			logger.info('✅ Redis connected successfully');
		} catch (error) {
			this.isConnected = false;
			logger.error('❌ Redis connection failed:', error);

			// Cleanup failed connection
			if (this.client) {
				try {
					await this.client.disconnect();
				} catch (e) {
					// Ignore disconnect errors
				}
				this.client = null;
			}

			// Don't throw - allow app to continue without Redis
		} finally {
			this.isConnecting = false;
		}
	}

	/**
	 * Set up Redis event handlers
	 */
	private setupEventHandlers(): void {
		if (!this.client) return;

		this.client.on('error', (error) => {
			logger.error('Redis error:', error);
			this.isConnected = false;
		});

		this.client.on('connect', () => {
			logger.info('Redis connected');
		});

		this.client.on('ready', () => {
			logger.info('Redis ready');
			this.isConnected = true;
		});

		this.client.on('reconnecting', () => {
			logger.info('Redis reconnecting...');
			this.isConnected = false;
		});

		this.client.on('end', () => {
			logger.info('Redis connection ended');
			this.isConnected = false;
		});
	}

	/**
	 * Check if Redis is available for operations
	 */
	public isAvailable(): boolean {
		return this.isConnected && this.client !== null && this.client.isOpen;
	}

	/**
	 * Gracefully handle operations when Redis is unavailable
	 */
	private async safeOperation<T>(
		operation: () => Promise<T>,
		operationName: string,
		fallback: T,
	): Promise<T> {
		if (!this.isAvailable()) {
			logger.warn(`Redis unavailable - ${operationName} skipped`);
			return fallback;
		}

		try {
			return await operation();
		} catch (error) {
			logger.error(`Redis ${operationName} failed:`, error);
			return fallback;
		}
	}

	/**
	 * Set a key-value pair with expiration
	 */
	public async set(
		key: string,
		value: any,
		expirationSeconds: number = 3600,
	): Promise<boolean> {
		return this.safeOperation(
			async () => {
				await this.client!.set(key, JSON.stringify(value), { EX: expirationSeconds });
				logger.debug(`Cached key: ${key}`);
				return true;
			},
			'set',
			false,
		);
	}

	/**
	 * Get a value by key
	 */
	public async get<T>(key: string): Promise<T | null> {
		return this.safeOperation(
			async () => {
				const data = await this.client!.get(key);
				return data ? (JSON.parse(data) as T) : null;
			},
			'get',
			null,
		);
	}

	/**
	 * Delete a key
	 */
	public async delete(key: string): Promise<boolean> {
		return this.safeOperation(
			async () => {
				const deleted = await this.client!.del(key);
				return deleted > 0;
			},
			'delete',
			false,
		);
	}

	/**
	 * Check if a key exists
	 */
	public async exists(key: string): Promise<boolean> {
		return this.safeOperation(
			async () => {
				const exists = await this.client!.exists(key);
				return exists === 1;
			},
			'exists',
			false,
		);
	}

	/**
	 * Clear all keys
	 */
	public async clear(): Promise<void> {
		await this.safeOperation(
			async () => {
				await this.client!.flushAll();
			},
			'clear',
			undefined,
		);
	}

	/**
	 * Subscribe to a channel
	 */
	public async subscribeToChannel(
		channel: string,
		callback: (message: string) => void,
	): Promise<boolean> {
		if (!this.isAvailable()) {
			logger.warn('Redis unavailable - subscription skipped');
			return false;
		}

		try {
			// Create subscriber client if needed
			if (!this.subscriberClient) {
				this.subscriberClient = createClient({ url });
				await this.subscriberClient.connect();
			}

			await this.subscriberClient.subscribe(channel, callback);
			logger.info(`Subscribed to channel: ${channel}`);
			return true;
		} catch (error) {
			logger.error(`Failed to subscribe to ${channel}:`, error);
			return false;
		}
	}

	/**
	 * Publish a message to a channel
	 */
	public async publishMessage(channel: string, message: string): Promise<boolean> {
		return this.safeOperation(
			async () => {
				await this.client!.publish(channel, message);
				logger.debug(`Published to ${channel}: ${message}`);
				return true;
			},
			'publish',
			false,
		);
	}

	/**
	 * Add a job to the queue
	 */
	public async addJob(job: string): Promise<boolean> {
		return this.safeOperation(
			async () => {
				await this.client!.rPush('jobs', job);
				return true;
			},
			'addJob',
			false,
		);
	}

	/**
	 * Process jobs from the queue
	 */
	public async processJobs(
		processor: (job: string) => void | Promise<void>,
	): Promise<boolean> {
		return this.safeOperation(
			async () => {
				while (true) {
					const job = await this.client!.lPop('jobs');
					if (!job) break;
					await processor(job);
				}
				return true;
			},
			'processJobs',
			false,
		);
	}

	/**
	 * Get connection status
	 */
	public getStatus(): {
		connected: boolean;
		available: boolean;
	} {
		return {
			connected: this.isConnected,
			available: this.isAvailable(),
		};
	}

	/**
	 * Cleanup and disconnect
	 */
	public async cleanup(): Promise<void> {
		try {
			if (this.client) {
				await this.client.quit();
				this.client = null;
			}

			if (this.subscriberClient) {
				await this.subscriberClient.quit();
				this.subscriberClient = null;
			}

			this.isConnected = false;
			logger.info('Redis disconnected successfully');
		} catch (error) {
			logger.error('Error during Redis cleanup:', error);
		}
	}

	/**
	 * Static helper to check if instance is connected
	 */
	public static isConnected(): boolean {
		return RedisClient.instance?.isAvailable() ?? false;
	}
}
