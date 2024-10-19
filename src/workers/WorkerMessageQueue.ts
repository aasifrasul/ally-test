import type { APIOptions, WorkerMessage } from '../types/api';
import { createLogger } from '../utils/logger';

const logger = createLogger('WorkerMessageQueue');

export class WorkerMessageQueue {
	private worker: Worker;
	private queue: Map<number, { resolve: Function; reject: Function }>;
	private currentId: number;
	private timeouts: Map<number, NodeJS.Timeout>;

	constructor(worker: Worker) {
		this.worker = worker;
		this.queue = new Map();
		this.currentId = 0;
		this.timeouts = new Map();

		this.worker.addEventListener('message', this.handleMessage.bind(this));
		this.worker.addEventListener('error', this.handleError.bind(this));
	}

	private handleError(error: ErrorEvent): void {
		logger.error('Worker error:', error);
	}

	async sendMessage(type: string, data: any, timeout = 30000): Promise<any> {
		const id = ++this.currentId;

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

	private handleMessage(event: MessageEvent<WorkerMessage>): void {
		const { id, data, error } = event.data;
		const pending = this.queue.get(id);

		if (pending) {
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
	}

	async fetchAPIData<T>(endpoint: string, options?: APIOptions): Promise<T> {
		return this.sendMessage('fetchAPIData', { endpoint, options });
	}

	async loadImages(imageUrls: string[]): Promise<string[]> {
		return this.sendMessage('loadImages', imageUrls);
	}

	async loadImage(imageUrl: string): Promise<string> {
		return this.sendMessage('loadImage', imageUrl);
	}

	async abortFetchRequest(endpoint: string): Promise<void> {
		return this.sendMessage('abortFetchRequest', endpoint);
	}

	terminate(): void {
		this.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
		this.timeouts.clear();
		this.queue.clear();
		this.worker.terminate();
	}
}
