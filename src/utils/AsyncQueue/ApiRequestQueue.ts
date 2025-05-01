import { ConcurrentAsyncQueue } from './ConcurrentAsyncQueue';

/**
 * Combines multiple queue capabilities: concurrency, retries, and timeouts
 * A complete solution for robust API request handling
 */
export class ApiRequestQueue<T> extends ConcurrentAsyncQueue<T> {
	private defaultTimeout: number;
	private maxRetries: number;
	private retryDelay: number;

	constructor(
		concurrentLimit: number = 3,
		maxRetries: number = 2,
		retryDelay: number = 1000,
		defaultTimeout: number = 10000,
	) {
		super(concurrentLimit);
		this.maxRetries = maxRetries;
		this.retryDelay = retryDelay;
		this.defaultTimeout = defaultTimeout;
	}

	// Add an API request with retries and timeout
	async addApiRequest(
		requestFn: () => Promise<T>,
		options: {
			timeout?: number;
			retries?: number;
			retryDelay?: number;
			autoDequeue?: boolean;
		} = {},
	): Promise<T> {
		const {
			timeout = this.defaultTimeout,
			retries = this.maxRetries,
			retryDelay = this.retryDelay,
			autoDequeue = true,
		} = options;

		// Create a wrapper that handles timeout and retries
		const actionWithTimeoutAndRetry = async (): Promise<T> => {
			let attempts = 0;
			let lastError: any;

			while (attempts <= retries) {
				try {
					// Create a promise race between the request and a timeout
					const result = await Promise.race([
						requestFn(),
						new Promise<never>((_, reject) => {
							const timeoutId = setTimeout(() => {
								reject(new Error(`Request timed out after ${timeout}ms`));
							}, timeout);

							// Cleanup timeout if Promise.race resolves with the actual result
							// This is important to prevent memory leaks
							return () => clearTimeout(timeoutId);
						}),
					]);

					return result;
				} catch (error) {
					attempts++;
					lastError = error;

					if (attempts <= retries) {
						// Calculate exponential backoff with jitter
						const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
						const actualDelay = Math.round(
							retryDelay * Math.pow(1.5, attempts - 1) * jitter,
						);

						console.warn(
							`API request attempt ${attempts} failed, retrying after ${actualDelay}ms...`,
							error,
						);
						await new Promise((resolve) => setTimeout(resolve, actualDelay));
					}
				}
			}

			// If we get here, all attempts failed
			throw new Error(`API request failed after ${attempts} attempts: ${lastError}`);
		};

		return this.addToQueue(actionWithTimeoutAndRetry, autoDequeue);
	}

	// Set new API request parameters
	setRequestOptions(options: {
		concurrentLimit?: number;
		maxRetries?: number;
		retryDelay?: number;
		defaultTimeout?: number;
	}): void {
		const { concurrentLimit, maxRetries, retryDelay, defaultTimeout } = options;

		if (concurrentLimit !== undefined) {
			this.setConcurrencyLimit(concurrentLimit);
		}

		if (maxRetries !== undefined) {
			if (maxRetries < 0) throw new Error('Max retries cannot be negative');
			this.maxRetries = maxRetries;
		}

		if (retryDelay !== undefined) {
			if (retryDelay < 0) throw new Error('Retry delay cannot be negative');
			this.retryDelay = retryDelay;
		}

		if (defaultTimeout !== undefined) {
			if (defaultTimeout < 100) throw new Error('Timeout must be at least 100ms');
			this.defaultTimeout = defaultTimeout;
		}
	}
}
