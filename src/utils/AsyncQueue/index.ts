import { BaseQueue } from './BaseQueue';

interface QueueItem<T> {
	action: () => Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}

export class AsyncQueue<T> extends BaseQueue<QueueItem<T>> {
	private isRunning: boolean = false;
	private isPaused: boolean = false;
	private isStopped: boolean = false;

	constructor() {
		super();
	}

	addToQueue(action: () => Promise<T>, autoDequeue: boolean = true): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			super.enqueue({ action, resolve, reject });
			if (autoDequeue && !this.isRunning) {
				void this.processQueue();
			}
		});
	}

	async processQueue(): Promise<boolean> {
		if (this.isRunning || this.isPaused || this.isStopped) {
			return false;
		}

		const item = super.dequeue();
		if (!item) return false;

		this.isRunning = true;

		try {
			const payload = await item.action();
			item.resolve(payload);
		} catch (error) {
			console.error('Error processing queue item:', error); // Log the error
			item.reject(error);
		} finally {
			this.isRunning = false;
			if (!this.isEmpty() && !this.isPaused && !this.isStopped) {
				void this.processQueue();
			}
		}

		return true;
	}

	stop(): void {
		this.isStopped = true;
	}

	pause(): void {
		this.isPaused = true;
	}

	async start(): Promise<boolean> {
		this.isStopped = false;
		this.isPaused = false;
		return this.processQueue();
	}
}
