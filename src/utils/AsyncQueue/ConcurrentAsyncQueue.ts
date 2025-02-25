import { AsyncQueue } from './index';

export class ConcurrentAsyncQueue<T> extends AsyncQueue<T> {
	private concurrentLimit: number;
	private runningTasks: number = 0;

	constructor(concurrentLimit: number = 3) {
		super();
		this.concurrentLimit = concurrentLimit;
	}

	async processQueue(): Promise<boolean> {
		if (
			this.isEmpty() ||
			this.isPaused ||
			this.isStopped ||
			this.runningTasks >= this.concurrentLimit
		) {
			return false;
		}

		this.runningTasks++;

		let item = this.dequeue(); // Use the parent's dequeue method
		if (!item) {
			this.runningTasks--; // Decrement if dequeue returned nothing.
			return false; // Queue is empty.
		}

		try {
			this.isRunning = true; // Set isRunning before awaiting item.action
			const payload = await item.action();
			item.resolve(payload);
			return true;
		} catch (error) {
			console.error('Error processing queue item:', error);
			item.reject(error);
			return false; // Return false if the task failed.
		} finally {
			this.runningTasks--;
			this.isRunning = this.runningTasks > 0;
			void this.processQueue(); // Continue processing in the background
		}
	}
}
