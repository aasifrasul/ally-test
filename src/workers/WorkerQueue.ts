import type { APIOptions, WorkerMessage } from '../types/api';
import { createLogger } from '../utils/logger';
import { getRandomId } from '../utils/common';
import { PromiseFactory } from '../utils/PromiseFactory';

const logger = createLogger('WorkerQueue');

export class WorkerQueue {
	private static instance: WorkerQueue | null = null;
	private worker: Worker;
	private factory: any;

	private constructor() {
		this.worker = new Worker(new URL('./MyWorker.worker.ts', import.meta.url));

		this.factory = new PromiseFactory<string>({
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
		const pending = this.factory.get(id);

		if (!pending) return;

		this.factory.remove(id);
		if (error) {
			pending.reject(new Error(error));
		} else {
			pending.resolve(data);
		}
	}

	private async sendMessage(type: string, data: any, timeout = 30000): Promise<any> {
		const id = getRandomId();

		this.factory.create(id, timeout);

		try {
			this.worker.postMessage({ id, type, data });
			return this.factory.get(id).promise;
		} catch (error) {
			this.factory.reject(id, error);
			this.factory.remove(id);
		}
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
		this.factory.clear();
		this.worker.terminate();
		WorkerQueue.instance = null;
	}
}
