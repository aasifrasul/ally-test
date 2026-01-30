import type { WorkerMessage } from '../types/api';
import { createLogger } from '../utils/Logger';
import { getRandomId } from '../utils/common';
import { PromiseFactory } from '../utils/PromiseFactory';
import { HTTPMethod } from '../types/api';
import { APIService } from '../services/APIService';
import { isUndefined } from '../utils/typeChecking';

const logger = createLogger('WorkerQueue');

export type TelemetryEvent =
	| { type: 'request:start'; key: string; endpoint: string; options?: RequestInit }
	| { type: 'request:success'; key: string; endpoint: string; durationMs: number }
	| {
			type: 'request:error';
			key: string;
			endpoint: string;
			error: string;
			durationMs: number;
	  }
	| { type: 'request:complete'; key: string; endpoint: string };

export class WorkerQueue {
	private static instance: WorkerQueue | null = null;
	private worker?: Worker;
	private promiseFactory: PromiseFactory;
	private isWorkerEnvironment: boolean;
	private requestKeyNormalizer?: (endpoint: string, options?: RequestInit) => string;
	private telemetrySubscribers: Array<(e: TelemetryEvent) => void> = [];

	private constructor() {
		this.isWorkerEnvironment = !isUndefined(window) && !isUndefined(Worker);

		// Initialize worker only in browser environments
		if (this.isWorkerEnvironment) {
			this.worker = new Worker(new URL('./MyWorker.worker.ts', import.meta.url));
		}

		this.promiseFactory = new PromiseFactory<string>({
			autoCleanup: true,
			cleanupDelay: 30000,
			enableLogging: true,
		});

		if (this.worker) {
			this.worker.addEventListener('message', this.handleMessage.bind(this));
			this.worker.addEventListener('error', this.handleError.bind(this));
		} else {
			logger.warn('Web Worker not available. Falling back to main-thread execution.');
		}
	}

	public static getInstance(): WorkerQueue {
		if (!WorkerQueue.instance) {
			WorkerQueue.instance = new WorkerQueue();
		}
		return WorkerQueue.instance;
	}

	// Allow applications/tests to customize how dedupe keys are generated
	public static setRequestKeyNormalizer(
		normalizer: (endpoint: string, options?: RequestInit) => string,
	): void {
		const instance = WorkerQueue.getInstance();
		instance.requestKeyNormalizer = normalizer;
	}

	public static subscribeTelemetry(subscriber: (e: TelemetryEvent) => void): () => void {
		const instance = WorkerQueue.getInstance();
		instance.telemetrySubscribers.push(subscriber);
		return () => {
			instance.telemetrySubscribers = instance.telemetrySubscribers.filter(
				(s) => s !== subscriber,
			);
		};
	}

	private emit(event: TelemetryEvent): void {
		try {
			this.telemetrySubscribers.forEach((s) => s(event));
		} catch (e) {
			// ignore subscriber errors
		}
	}

	private handleError(error: ErrorEvent): void {
		logger.error('Worker error:', error);
	}

	private handleMessage(event: MessageEvent<WorkerMessage>): void {
		const { id, data, error } = event.data;
		const pending = this.promiseFactory.get(id);

		if (!pending) return;

		this.clearRequest(id);

		if (error) {
			pending.reject(new Error(error));
		} else {
			pending.resolve(data);
		}
	}

	// Create deterministic key for request deduplication
	private createRequestKey(endpoint: string, options: RequestInit = {}): string {
		if (this.requestKeyNormalizer) {
			return this.requestKeyNormalizer(endpoint, options);
		}

		// Default normalization: stable header order, ignore volatile headers by default
		const method = options.method || HTTPMethod.GET;
		const rawHeaders = (options.headers || {}) as Record<string, string>;
		const IGNORE_HEADERS = ['authorization', 'cookie'];
		const normalizedHeaders = Object.keys(rawHeaders)
			.filter((k) => !IGNORE_HEADERS.includes(k.toLowerCase()))
			.sort()
			.reduce<Record<string, string>>((acc, key) => {
				acc[key] = rawHeaders[key];
				return acc;
			}, {});

		// Include body only for non-GET methods
		const body = method === HTTPMethod.GET ? '' : JSON.stringify(options.body || '');

		return `${method}:${endpoint}:${JSON.stringify(normalizedHeaders)}:${body}`;
	}

	private async sendMessage(
		type: string,
		data: any,
		timeout = 30000,
		requestKey?: string,
	): Promise<any> {
		// Use requestKey for deduplication, fallback to random ID
		const id = requestKey || getRandomId();
		const existing = this.promiseFactory.get(id);

		if (existing) {
			logger.debug('Returning existing promise for request:', id);
			return existing.promise;
		}

		// Create new promise and send message to worker or execute inline if worker not available
		const pending = this.promiseFactory.create(id, timeout);
		const message: WorkerMessage = { id, type, data };

		const endpoint = data?.endpoint ?? 'unknown';
		const key = id;
		const startedAt = Date.now();
		this.emit({ type: 'request:start', key, endpoint, options: data?.options });

		try {
			if (this.worker) {
				this.worker.postMessage(message);
				logger.debug('New request created and sent to worker:', id);
				// Wrap promise to emit success/error/complete
				pending.promise
					.then(() => {
						const durationMs = Date.now() - startedAt;
						this.emit({ type: 'request:success', key, endpoint, durationMs });
					})
					.catch((err: any) => {
						const durationMs = Date.now() - startedAt;
						this.emit({
							type: 'request:error',
							key,
							endpoint,
							error: String(err?.message || err),
							durationMs,
						});
					})
					.finally(() => {
						this.emit({ type: 'request:complete', key, endpoint });
					});
				return pending.promise;
			}

			// Fallback: execute on main thread
			this.executeInMainThread(type, data)
				.then((result) => {
					this.clearRequest(id);
					const durationMs = Date.now() - startedAt;
					this.emit({ type: 'request:success', key, endpoint, durationMs });
					pending.resolve(result);
				})
				.catch((err) => {
					this.clearRequest(id);
					const durationMs = Date.now() - startedAt;
					this.emit({
						type: 'request:error',
						key,
						endpoint,
						error: String(err?.message || err),
						durationMs,
					});
					pending.reject(err);
				})
				.finally(() => {
					this.emit({ type: 'request:complete', key, endpoint });
				});

			return pending.promise;
		} catch (error) {
			pending.reject(error as any);
			this.promiseFactory.remove(id);
			throw error;
		}
	}

	// Execute worker message types directly on the main thread as a fallback
	private async executeInMainThread(type: string, data: any): Promise<any> {
		switch (type) {
			case 'fetchAPIData': {
				const { endpoint, options } = data as {
					endpoint: string;
					options?: RequestInit;
				};

				const response = await APIService.getInstance().fetch(endpoint, options);
				return response;
			}
			case 'abortFetchRequest': {
				// Not supported in fallback since requests are not tracked with controllers here
				return Promise.resolve();
			}
			default:
				throw new Error(`Unsupported operation in fallback mode: ${type}`);
		}
	}

	isAPIAlreadyRunning(endpoint: string, options?: RequestInit) {
		const requestKey = this.createRequestKey(endpoint, options);
		return this.promiseFactory.has(requestKey);
	}

	// Public API methods
	async fetchAPIData<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
		// Create deterministic key for request deduplication
		const requestKey = this.createRequestKey(endpoint, options);

		return this.sendMessage('fetchAPIData', { endpoint, options }, 30000, requestKey);
	}

	async loadImages(imageUrls: string[]): Promise<string[]> {
		// For batch operations, create key based on sorted URLs to handle order variations
		const sortedUrls = [...imageUrls].sort();
		const requestKey = `loadImages:${JSON.stringify(sortedUrls)}`;

		return this.sendMessage('loadImages', imageUrls, 30000, requestKey);
	}

	async loadImage(imageUrl: string): Promise<string> {
		// Use URL as key for single image loads
		const requestKey = `loadImage:${imageUrl}`;

		return this.sendMessage('loadImage', imageUrl, 30000, requestKey);
	}

	async startCurrencyStream(): Promise<void> {
		// Currency stream should probably not be deduplicated, or use a fixed key
		const requestKey = 'currencyStream:singleton';

		return this.sendMessage('startCurrencyStream', null, 30000, requestKey);
	}

	async abortFetchRequest(endpoint: string): Promise<void> {
		// Don't deduplicate abort requests - they should always execute
		return this.sendMessage('abortFetchRequest', endpoint);
	}

	// Method to abort specific deduplicated requests
	abortRequest(endpoint: string, options?: RequestInit): void {
		const requestKey = this.createRequestKey(endpoint, options);
		const pending = this.promiseFactory.get(requestKey);

		if (pending) {
			pending.reject(new Error('Request aborted by client'));
			this.promiseFactory.remove(requestKey);
			logger.debug('Aborted deduplicated request:', requestKey);
		}
	}

	// Get info about pending requests (useful for debugging)
	getPendingRequestsInfo(): { count: number; keys: string[] } {
		return {
			count: this.promiseFactory.size,
			keys: this.promiseFactory.getAllKeys(),
		};
	}

	// Clear specific request from queue (useful for cache invalidation scenarios)
	clearRequest(requestKey: string): void {
		if (this.promiseFactory.get(requestKey)) {
			this.promiseFactory.remove(requestKey);
			logger.debug('Cleared request from queue:', requestKey);
		}
	}

	terminate(): void {
		this.promiseFactory.clear();
		if (this.worker) {
			this.worker.terminate();
		}
		WorkerQueue.instance = null;
	}
}
