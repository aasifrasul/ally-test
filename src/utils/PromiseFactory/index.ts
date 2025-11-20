import { Deferred } from './Deferred';
import { createLogger } from '../Logger';

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

/**
 * Enhanced promise factory with better error handling, cleanup, and debugging
 */
export class PromiseFactory<T = any> {
	private promises: Map<string, Deferred<T>>;
	private options: Required<PromiseFactoryOptions>;
	private cleanupInterval: NodeJS.Timeout | null = null;
	private scheduledCleanups: Map<string, NodeJS.Timeout> = new Map(); // Track individual cleanups
	private logger = createLogger('PromiseFactory');

	constructor(options: Partial<PromiseFactoryOptions> = {}) {
		this.promises = new Map<string, Deferred<T>>();
		this.options = {
			autoCleanup: true,
			cleanupDelay: 60000,
			maxPromises: 1000,
			enableLogging: false,
			...options, // user-supplied overrides last
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
	private validateKey(key: string): void {
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
	private log(action: string, key: string, extra: Record<string, any> = {}): void {
		if (this.options.enableLogging) {
			this.logger.debug(`[PromiseFactory] ${action}:`, {
				key,
				...extra,
				total: this.size,
			});
		}
	}

	/**
	 * Checks if we've hit the maximum number of promises
	 * @private
	 */
	private checkMaxPromises(): void {
		if (this.promises.size >= this.options.maxPromises) {
			for (const [key, d] of this.promises) {
				if (d.isSettled) {
					this.remove(key);
					break;
				}
			}
		}
	}

	/**
	 * Creates a new deferred promise with the given key.
	 * @param key The unique key for the promise.
	 * @param timeoutMs Optional timeout in milliseconds for the promise.
	 * @param allowOverwrite If true, overwrites existing promise instead of throwing
	 * @returns The created Deferred promise.
	 * @throws Error if a promise with the key already exists (unless allowOverwrite is true) or max promises exceeded.
	 */
	create(
		key: string,
		timeoutMs: number | null = null,
		allowOverwrite: boolean = false,
	): Deferred<T> {
		this.validateKey(key);
		this.checkMaxPromises();

		if (this.has(key)) {
			if (allowOverwrite) {
				this.remove(key);
			} else {
				throw new Error(`Promise with key "${key}" already exists`);
			}
		}

		const deferred = new Deferred<T>();

		if (timeoutMs) {
			deferred.timeout(timeoutMs);
		}

		this.promises.set(key, deferred);
		this.log('CREATE', key, { timeout: timeoutMs, overwrite: allowOverwrite });

		return deferred;
	}

	/**
	 * Gets an existing promise by key.
	 * @param key The key of the promise to retrieve.
	 * @returns The Deferred promise if found, otherwise undefined.
	 */
	get(key: string): Deferred<T> | undefined {
		return this.has(key) ? this.promises.get(key) : undefined;
	}

	/**
	 * Creates a promise if it doesn't exist, or returns existing one.
	 * This is different from create() which throws on existing keys.
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
		this.validateKey(key);
		return this.promises.has(key);
	}

	// Get all current promise keys (useful for debugging)
	getAllKeys(): string[] {
		return Array.from(this.promises.keys());
	}

	// Get count of pending promises
	getCount(): number {
		return this.promises.size;
	}

	/**
	 * Resolves a promise with the given key and value.
	 * @param key The key of the promise to resolve.
	 * @param value The value to resolve the promise with.
	 * @returns True if the promise was resolved, false if it was already settled.
	 * @throws Error if no promise is found with the key.
	 */
	resolve(key: string, value: T): boolean {
		const deferred = this.get(key);

		if (!deferred) {
			throw new Error(`No promise found with key "${key}"`);
		}

		if (!deferred.isPending) {
			this.logger.warn(`Promise "${key}" is already settled`);
			return false;
		}

		deferred.resolve(value);
		this.log('RESOLVE', key, { value });

		// Schedule cleanup if auto-cleanup is enabled
		if (this.options.autoCleanup) {
			this.scheduleCleanup(key);
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
		const deferred = this.get(key);

		if (!deferred) {
			throw new Error(`No promise found with key "${key}"`);
		}

		if (!deferred.isPending) {
			this.logger.warn(`Promise "${key}" is already settled`);
			return false;
		}

		deferred.reject(error);
		this.log('REJECT', key, { error: error?.message });

		// Schedule cleanup if auto-cleanup is enabled
		if (this.options.autoCleanup) {
			this.scheduleCleanup(key);
		}

		return true;
	}

	/**
	 * Removes a promise from the factory with proper cleanup.
	 * @param key The key of the promise to remove.
	 * @returns True if the promise was removed, false otherwise.
	 */
	remove(key: string): boolean {
		this.validateKey(key);

		if (!this.has(key)) {
			this.log('REMOVE_SKIPPED', key);
			return false;
		}

		// Clear any scheduled cleanup
		const scheduledCleanup = this.scheduledCleanups.get(key);
		if (scheduledCleanup) {
			clearTimeout(scheduledCleanup);
			this.scheduledCleanups.delete(key);
		}

		const existed = this.promises.delete(key);

		if (existed) {
			this.log('REMOVE', key);
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
		this.log('CLEAR_ALL', 'all', { cleared: count });
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
	getStats(includeSettled = true): PromiseFactoryStats {
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
			if (deferred.isPending) {
				if (includeSettled === false) stats.pending++;
			} else if (deferred.isResolved) stats.resolved++;
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

	async runWithKey(key: string, fn: () => Promise<T>, timeoutMs?: number): Promise<T> {
		const deferred = this.create(key, timeoutMs);
		try {
			const result = await fn();
			deferred.resolve(result);
			return result;
		} catch (err) {
			deferred.reject(err);
			throw err;
		}
	}

	/**
	 * Waits for any one of the specified promises to resolve.
	 * @param keys An array of keys of the promises to wait for.
	 * @param timeoutMs Optional timeout in milliseconds.
	 * @returns A promise that resolves when the first promise resolves.
	 */
	async waitForAny(keys: string[], timeoutMs: number | null = null): Promise<T> {
		if (!Array.isArray(keys) || keys.length === 0) {
			throw new Error('Keys must be a non-empty array');
		}

		const promises = keys.map((key) => {
			const deferred = this.get(key);
			if (!deferred) {
				throw new Error(`No promise found with key "${key}"`);
			}
			return deferred.promise;
		});

		if (timeoutMs) {
			const timeoutPromise = new Promise<T>((_, reject) => {
				setTimeout(
					() => reject(new Error('Timeout waiting for any promise')),
					timeoutMs,
				);
			});
			return Promise.race([Promise.race(promises), timeoutPromise]);
		}

		return Promise.race(promises);
	}

	/**
	 * Gets promises that match a pattern.
	 * @param pattern RegExp or string pattern to match keys against.
	 * @returns Array of matching deferred promises with their keys.
	 */
	findByPattern(pattern: RegExp | string): Array<{ key: string; deferred: Deferred<T> }> {
		const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
		const matches: Array<{ key: string; deferred: Deferred<T> }> = [];

		for (const [key, deferred] of this.promises) {
			if (regex.test(key)) {
				matches.push({ key, deferred });
			}
		}

		return matches;
	}

	/**
	 * Schedules cleanup for a settled promise with proper timeout tracking.
	 * @param key The key of the promise to schedule for cleanup.
	 * @private
	 */
	private scheduleCleanup(key: string): void {
		// Clear existing cleanup timeout if any
		const existingTimeout = this.scheduledCleanups.get(key);
		if (existingTimeout) clearTimeout(existingTimeout);

		const timeoutId = setTimeout(() => {
			const deferred = this.get(key);
			if (deferred?.isSettled) this.remove(key);
			this.scheduledCleanups.delete(key);
		}, this.options.cleanupDelay);

		this.scheduledCleanups.set(key, timeoutId);
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
				this.log('AUTO_CLEANUP', 'multiple', { removed: toRemove.length });
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
		for (const timeout of this.scheduledCleanups.values()) {
			clearTimeout(timeout);
		}
		this.scheduledCleanups.clear();
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
