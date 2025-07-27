import { Deferred } from './Deferred';
import { createLogger } from '../logger';

/**
 * Interface for PromiseFactory configuration options.
 */
export interface PromiseFactoryOptions {
	autoCleanup?: boolean;
	cleanupDelay?: number;
	maxPromises?: number;
	enableLogging?: boolean;
}

/**
 * Interface for PromiseFactory statistics.
 */
export interface PromiseFactoryStats {
	total: number;
	pending: number;
	resolved: number;
	rejected: number;
	oldest: string | null;
	newest: string | null;
}

const logger = createLogger('PromiseFactory');

/**
 * Enhanced promise factory with better error handling, cleanup, and debugging
 */
export class PromiseFactory<T = any> {
	private promises: Map<string, Deferred<T>>;
	private options: Required<PromiseFactoryOptions>;
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor(options: Partial<PromiseFactoryOptions> = {}) {
		this.promises = new Map<string, Deferred<T>>();
		this.options = {
			autoCleanup: options.autoCleanup ?? true,
			cleanupDelay: options.cleanupDelay ?? 60000, // 1 minute default
			maxPromises: options.maxPromises ?? 1000,
			enableLogging: options.enableLogging ?? false,
			...options,
		};

		if (this.options.autoCleanup) {
			this.startAutoCleanup();
		}
	}

	/**
	 * Validates the key parameter
	 * @param key The key to validate.
	 * @private
	 */
	private _validateKey(key: string): void {
		if (!key || typeof key !== 'string') {
			throw new Error('Key must be a non-empty string');
		}
	}

	/**
	 * Logs debug information if logging is enabled
	 * @param action The action being performed (e.g., 'CREATE', 'RESOLVE').
	 * @param key The key associated with the promise.
	 * @param extra Additional data to log.
	 * @private
	 */
	private _log(action: string, key: string, extra: Record<string, any> = {}): void {
		if (this.options.enableLogging) {
			logger.debug(`[PromiseFactory] ${action}:`, { key, ...extra, total: this.size });
		}
	}

	/**
	 * Checks if we've hit the maximum number of promises
	 * @private
	 */
	private _checkMaxPromises(): void {
		if (this.promises.size >= this.options.maxPromises) {
			throw new Error(
				`Maximum number of promises (${this.options.maxPromises}) exceeded`,
			);
		}
	}

	/**
	 * Creates a new deferred promise with the given key.
	 * @param key The unique key for the promise.
	 * @param timeoutMs Optional timeout in milliseconds for the promise.
	 * @returns The created Deferred promise.
	 * @throws Error if a promise with the key already exists or max promises exceeded.
	 */
	create(key: string, timeoutMs: number | null = null): Deferred<T> {
		this._checkMaxPromises();

		if (this.has(key)) {
			logger.error(`Promise with key "${key}" already exists`);
			const promise = this.promises.get(key);

			if (!promise) {
				throw new Error(`Something weird!`);
			}

			return promise;
		}

		const deferred = new Deferred<T>();

		if (timeoutMs) {
			deferred.timeout(timeoutMs);
		}

		this.promises.set(key, deferred);
		this._log('CREATE', key, { timeout: timeoutMs });

		return deferred;
	}

	/**
	 * Gets an existing promise by key.
	 * @param key The key of the promise to retrieve.
	 * @returns The Deferred promise if found, otherwise undefined.
	 */
	get(key: string): Deferred<T> | undefined {
		this._validateKey(key);
		return this.promises.get(key);
	}

	/**
	 * Gets an existing promise or creates a new one.
	 * @param key The key of the promise to get or create.
	 * @param timeoutMs Optional timeout in milliseconds if a new promise is created.
	 * @returns The Deferred promise.
	 */
	getOrCreate(key: string, timeoutMs: number | null = null): Deferred<T> {
		return this.get(key) || this.create(key, timeoutMs);
	}

	/**
	 * Checks if a promise exists for the given key.
	 * @param key The key to check.
	 * @returns True if the promise exists, false otherwise.
	 */
	has(key: string): boolean {
		this._validateKey(key);
		return this.promises.has(key);
	}

	/**
	 * Resolves a promise with the given key and value.
	 * @param key The key of the promise to resolve.
	 * @param value The value to resolve the promise with.
	 * @returns True if the promise was resolved, false if it was already settled.
	 * @throws Error if no promise is found with the key.
	 */
	resolve(key: string, value: T): boolean {
		this._validateKey(key);
		const deferred = this.promises.get(key);

		if (!deferred) {
			throw new Error(`No promise found with key "${key}"`);
		}

		if (!deferred.isPending) {
			logger.warn(`Promise "${key}" is already settled`);
			return false;
		}

		deferred.resolve(value);
		this._log('RESOLVE', key, { value });

		// Schedule cleanup if auto-cleanup is enabled
		if (this.options.autoCleanup) {
			this._scheduleCleanup(key);
		}

		return true;
	}

	/**
	 * Rejects a promise with the given key and error.
	 * @param key The key of the promise to reject.
	 * @param error The error to reject the promise with.
	 * @returns True if the promise was rejected, false if it was already settled.
	 * @throws Error if no promise is found with the key.
	 */
	reject(key: string, error: any): boolean {
		this._validateKey(key);
		const deferred = this.promises.get(key);

		if (!deferred) {
			throw new Error(`No promise found with key "${key}"`);
		}

		if (!deferred.isPending) {
			logger.warn(`Promise "${key}" is already settled`);
			return false;
		}

		deferred.reject(error);
		this._log('REJECT', key, { error: error?.message });

		// Schedule cleanup if auto-cleanup is enabled
		if (this.options.autoCleanup) {
			this._scheduleCleanup(key);
		}

		return true;
	}

	/**
	 * Removes a promise from the factory.
	 * @param key The key of the promise to remove.
	 * @returns True if the promise was removed, false otherwise.
	 */
	remove(key: string): boolean {
		this._validateKey(key);
		const existed = this.promises.delete(key);

		if (existed) {
			this._log('REMOVE', key);
		}

		return existed;
	}

	/**
	 * Clears all promises from the factory.
	 * @returns The number of promises cleared.
	 */
	clear(): number {
		const count = this.promises.size;
		this.promises.clear();
		this._log('CLEAR_ALL', 'all', { cleared: count });
		return count;
	}

	/**
	 * Gets the number of active promises.
	 */
	get size(): number {
		return this.promises.size;
	}

	/**
	 * Gets all promise keys.
	 * @returns An array of all promise keys.
	 */
	keys(): string[] {
		return Array.from(this.promises.keys());
	}

	/**
	 * Gets statistics about the current promises.
	 * @returns An object containing statistics about the promises.
	 */
	getStats(): PromiseFactoryStats {
		const stats: PromiseFactoryStats = {
			total: this.promises.size,
			pending: 0,
			resolved: 0,
			rejected: 0,
			oldest: null,
			newest: null,
		};

		let oldestTime = Infinity;
		let newestTime = 0;

		for (const [key, deferred] of this.promises) {
			if (deferred.isPending) stats.pending++;
			else if (deferred.isResolved) stats.resolved++;
			else if (deferred.isRejected) stats.rejected++;

			if (deferred.createdAt < oldestTime) {
				oldestTime = deferred.createdAt;
				stats.oldest = key;
			}

			if (deferred.createdAt > newestTime) {
				newestTime = deferred.createdAt;
				stats.newest = key;
			}
		}

		return stats;
	}

	/**
	 * Waits for multiple promises to resolve.
	 * @param keys An array of keys of the promises to wait for.
	 * @param timeoutMs Optional timeout in milliseconds for waiting for all promises.
	 * @returns A promise that resolves when all specified promises resolve, or rejects if any reject or timeout occurs.
	 * @throws Error if keys is not an array or if any promise key is not found.
	 */
	async waitForAll(keys: string[], timeoutMs: number | null = null): Promise<T[]> {
		if (!Array.isArray(keys)) {
			throw new Error('Keys must be an array');
		}

		const promises = keys.map((key) => {
			const deferred = this.get(key);
			if (!deferred) {
				throw new Error(`No promise found with key "${key}"`);
			}
			return deferred.promise;
		});

		if (timeoutMs) {
			const timeoutPromise = new Promise<T[]>((_, reject) => {
				setTimeout(() => reject(new Error('Timeout waiting for promises')), timeoutMs);
			});
			return Promise.race([Promise.all(promises), timeoutPromise]);
		}

		return Promise.all(promises);
	}

	/**
	 * Schedules cleanup for a settled promise.
	 * @param key The key of the promise to schedule for cleanup.
	 * @private
	 */
	private _scheduleCleanup(key: string): void {
		setTimeout(() => {
			const deferred = this.promises.get(key);
			if (deferred && deferred.isSettled) {
				this.remove(key);
			}
		}, this.options.cleanupDelay);
	}

	/**
	 * Starts the auto-cleanup process. This periodically removes settled promises.
	 */
	startAutoCleanup(): void {
		if (this.cleanupInterval) return;

		this.cleanupInterval = setInterval(() => {
			const now = Date.now();
			const toRemove: string[] = [];

			for (const [key, deferred] of this.promises) {
				const age = now - deferred.createdAt;
				if (deferred.isSettled && age > this.options.cleanupDelay) {
					toRemove.push(key);
				}
			}

			toRemove.forEach((key) => this.remove(key));

			if (toRemove.length > 0) {
				this._log('AUTO_CLEANUP', 'multiple', { removed: toRemove.length });
			}
		}, this.options.cleanupDelay);
	}

	/**
	 * Stops the auto-cleanup process.
	 */
	stopAutoCleanup(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
	}

	/**
	 * Disposes of the PromiseFactory, stopping auto-cleanup and clearing all promises.
	 */
	dispose(): void {
		this.stopAutoCleanup();
		this.clear();
	}
}

// Example usage:
/*
async function runExample() {
	const factory = new PromiseFactory<string>({
		autoCleanup: true,
		cleanupDelay: 30000,
		enableLogging: true,
	});

	try {
		// Create a promise with timeout
		const deferredUserData = factory.create('userData', 5000);
		console.log('Is userData pending?', deferredUserData.isPending); // true

		// Create another promise
		const deferredConfig = factory.create('config');

		// Resolve 'userData' after some time
		setTimeout(() => {
			factory.resolve('userData', 'User data loaded successfully!');
		}, 2000);

		// Reject 'config' after some time
		setTimeout(() => {
			factory.reject('config', new Error('Failed to load config!'));
		}, 1000);

		// Wait for multiple promises
		console.log('\nWaiting for userData and config...');
		try {
			const results = await factory.waitForAll(['userData', 'config'], 10000);
			console.log('waitForAll results:', results); // This might not be reached if config rejects
		} catch (error: any) {
			console.error('Error waiting for promises:', error.message);
		}

		// Get statistics
		console.log('\nFactory Stats:', factory.getStats());

		// Demonstrate getting or creating
		const existingOrNew = factory.getOrCreate('anotherPromise');
		console.log('Is anotherPromise pending?', existingOrNew.isPending);

		// Resolve 'anotherPromise'
		factory.resolve('anotherPromise', 'This was dynamically created or retrieved!');

		// Wait for auto-cleanup to potentially run (adjust cleanupDelay for quicker testing)
		console.log('\nWaiting for cleanup...');
		await new Promise(resolve => setTimeout(resolve, factory.options.cleanupDelay + 1000));
		console.log('Factory Stats after cleanup delay:', factory.getStats());


	} catch (error: any) {
		console.error('An error occurred:', error.message);
	} finally {
		factory.dispose();
		console.log('Factory disposed. Final Stats:', factory.getStats());
	}
}

runExample();
*/
