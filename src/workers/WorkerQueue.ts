import type { APIOptions, WorkerMessage } from '../types/api';
import { createLogger } from '../utils/logger';
import { getRandomId } from '../utils/common';

const logger = createLogger('WorkerQueue');

export class WorkerQueue {
	private static instance: WorkerQueue | null = null;
	private worker: Worker;
	private queue: Map<string, { resolve: Function; reject: Function }>;
	private timeouts: Map<string, NodeJS.Timeout>;

	private constructor() {
		this.worker = new Worker(new URL('./MyWorker.worker.ts', import.meta.url));
		this.queue = new Map();
		this.timeouts = new Map();

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
		const pending = this.queue.get(id);

		if (!pending) return;
		
		const timeoutId = this.timeouts.get(id);
		if (timeoutId) {
			clearTimeout(timeoutId);
			this.timeouts.delete(id);
		}

		this.queue.delete(id);
		if (error) {
			pending.reject(new Error(error));
		} else {
			pending.resolve(data);
		}
	}

	private async sendMessage(type: string, data: any, timeout = 30000): Promise<any> {
		const id = getRandomId();

		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				this.queue.delete(id);
				reject(new Error(`Request timeout after ${timeout}ms`));
			}, timeout);

			this.timeouts.set(id, timeoutId);
			this.queue.set(id, { resolve, reject });

			try {
				this.worker.postMessage({ id, type, data });
			} catch (error) {
				this.queue.delete(id);
				clearTimeout(timeoutId);
				this.timeouts.delete(id);
				reject(error);
			}
		});
	}

	// Public API methods
	async fetchAPIData<T>(endpoint: string, options?: APIOptions): Promise<T> {
		return this.sendMessage('fetchAPIData', { endpoint, options });
	}

	async loadImages(imageUrls: string[]): Promise<string[]> {
		return this.sendMessage('loadImages', imageUrls);
	}

	async loadImage(imageUrl: string): Promise<string> {
		return this.sendMessage('loadImage', imageUrl);
	}

	async startCurrencyStream(): Promise<void> {
		return this.sendMessage('startCurrencyStream', null);
	}

	async abortFetchRequest(endpoint: string): Promise<void> {
		return this.sendMessage('abortFetchRequest', endpoint);
	}

	terminate(): void {
		this.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
		this.timeouts.clear();
		this.queue.clear();
		this.worker.terminate();
		WorkerQueue.instance = null;
	}
}
