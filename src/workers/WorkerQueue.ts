import type { APIOptions, WorkerMessage } from '../types/api';
import { createLogger } from '../utils/Logger';
import { getRandomId } from '../utils/common';
import { PromiseFactory } from '../utils/PromiseFactory';
import { HTTPMethod } from '../types/api';

const logger = createLogger('WorkerQueue');

export class WorkerQueue {
	private static instance: WorkerQueue | null = null;
	private worker: Worker;
	private promiseFactory: PromiseFactory;

	private constructor() {
		this.worker = new Worker(new URL('./MyWorker.worker.ts', import.meta.url));

		this.promiseFactory = new PromiseFactory<string>({
			autoCleanup: true,
			cleanupDelay: 30000,
			enableLogging: true,
		});

		this.worker.addEventListener('message', this.handleMessage.bind(this));
		this.worker.addEventListener('error', this.handleError.bind(this));
	}

	public static getInstance(): WorkerQueue {
		if (!WorkerQueue.instance) {
			WorkerQueue.instance = new WorkerQueue();
		}
		return WorkerQueue.instance;
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
	private createRequestKey(endpoint: string, options: APIOptions = {}): string {
		const method = options.method || HTTPMethod.GET;
		const headers = JSON.stringify(options.headers || {});
		// Include body in key for non-GET requests
		const body = method === HTTPMethod.GET ? '' : JSON.stringify(options.body || '');

		return `${method}:${endpoint}:${headers}:${body}`;
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

		// Create new promise and send message to worker
		const pending = this.promiseFactory.create(id, timeout);
		const message: WorkerMessage = { id, type, data };

		try {
			this.worker.postMessage(message);
			logger.debug('New request created and sent to worker:', id);
			return pending.promise;
		} catch (error) {
			pending.reject(error);
			this.promiseFactory.remove(id);
			throw error;
		}
	}

	isAPIAlreadyRunning(endpoint: string, options?: APIOptions) {
		const requestKey = this.createRequestKey(endpoint, options);
		return this.promiseFactory.has(requestKey);
	}

	// Public API methods
	async fetchAPIData<T = unknown>(endpoint: string, options?: APIOptions): Promise<T> {
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
	abortRequest(endpoint: string, options?: APIOptions): void {
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
			count: this.promiseFactory.getCount(),
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
		this.worker.terminate();
		WorkerQueue.instance = null;
	}
}
