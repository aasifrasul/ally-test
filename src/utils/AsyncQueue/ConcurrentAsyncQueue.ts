import { AsyncQueue } from './index';

export class ConcurrentAsyncQueue<T> extends AsyncQueue<T> {
	private concurrentLimit: number;
	private runningTasks: number = 0;

	constructor(concurrentLimit: number = 3) {
		super();
		this.concurrentLimit = concurrentLimit;
	}

	// Override to handle concurrency
	async addToQueue(action: () => Promise<T>, autoDequeue: boolean = true): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			super.enqueue({ action, resolve, reject });

			if (autoDequeue) {
				// Start as many tasks as possible up to the concurrency limit
				for (let i = 0; i < this.concurrentLimit; i++) {
					void this.processQueue();
				}
			}
		});
	}

	// Override to handle concurrency tracking
	async processQueue(): Promise<boolean> {
		if (
			this.isEmpty() ||
			this.isPaused ||
			this.isStopped ||
			this.runningTasks >= this.concurrentLimit
		) {
			return false;
		}

		const item = super.dequeue();
		if (!item) return false;

		this.runningTasks++;
		this.isRunning = true;

		try {
			const payload = await item.action();
			item.resolve(payload);
		} catch (error) {
			console.error('Error processing queue item:', error);
			item.reject(error);
		} finally {
			this.runningTasks--;
			this.isRunning = this.runningTasks > 0;

			// Try to process another item if there are items left
			// and we haven't reached the concurrency limit
			void this.processQueue();
		}

		return true;
	}

	// Override to properly handle concurrency
	async start(): Promise<boolean> {
		this.isStopped = false;
		this.isPaused = false;

		// Start multiple tasks up to the concurrency limit
		let started = false;
		for (let i = 0; i < this.concurrentLimit; i++) {
			const result = await this.processQueue();
			started = started || result;
		}

		return started;
	}

	// Get current number of running tasks
	get activeTaskCount(): number {
		return this.runningTasks;
	}

	// Update concurrency limit (useful for dynamic adjustment)
	setConcurrencyLimit(limit: number): void {
		if (limit < 1) {
			throw new Error('Concurrency limit must be at least 1');
		}
		this.concurrentLimit = limit;

		// If we increased the limit, try to process more items
		if (!this.isPaused && !this.isStopped) {
			for (let i = 0; i < this.concurrentLimit; i++) {
				void this.processQueue();
			}
		}
	}
}
