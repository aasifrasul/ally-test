import { BaseQueue } from './BaseQueue';

export interface QueueItem<T> {
	action: () => Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}

export class AsyncQueue<T> extends BaseQueue<{
	action: () => Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}> {
	protected isPaused: boolean = false;
	protected isStopped: boolean = false;
	protected isRunning: boolean = false;

	constructor() {
		super();
	}

	// Add an async action to the queue
	async addToQueue(action: () => Promise<T>, autoDequeue: boolean = true): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.enqueue({ action, resolve, reject });

			if (autoDequeue) {
				void this.processQueue();
			}
		});
	}

	// Process the next item in the queue
	async processQueue(): Promise<boolean> {
		if (this.isEmpty() || this.isPaused || this.isStopped) {
			return false;
		}

		const item = this.dequeue();
		if (!item) return false;

		this.isRunning = true;

		try {
			const payload = await item.action();
			item.resolve(payload);
		} catch (error) {
			console.error('Error processing queue item:', error);
			item.reject(error);
		} finally {
			this.isRunning = !this.isEmpty() && !this.isPaused && !this.isStopped;

			// Process the next item if there are any left
			if (!this.isEmpty() && !this.isPaused && !this.isStopped) {
				void this.processQueue();
			}
		}

		return true;
	}

	// Start processing the queue
	async start(): Promise<boolean> {
		this.isStopped = false;
		this.isPaused = false;
		return this.processQueue();
	}

	// Pause processing the queue
	pause(): void {
		this.isPaused = true;
	}

	// Resume processing the queue
	resume(): void {
		if (this.isPaused) {
			this.isPaused = false;
			void this.processQueue();
		}
	}

	// Stop processing the queue completely
	stop(): void {
		this.isStopped = true;
	}

	// Check if the queue is currently processing items
	get running(): boolean {
		return this.isRunning;
	}

	// Check if the queue is paused
	get paused(): boolean {
		return this.isPaused;
	}

	// Check if the queue is stopped
	get stopped(): boolean {
		return this.isStopped;
	}
}
