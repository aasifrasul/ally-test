import { AsyncQueue } from './index';

export class BatchAsyncQueue<T> extends AsyncQueue<T> {
	private batchSize: number;
	private processing: boolean = false; // Flag to prevent concurrent batch processing

	constructor(batchSize: number) {
		super();
		this.batchSize = batchSize;
	}

	async processBatch(): Promise<T[]> {
		if (this.processing || this.isEmpty()) {
			// Prevent concurrent batches or empty queue
			return []; // Or you could return a Promise that resolves later
		}

		this.processing = true;
		const batch: T[] = [];

		try {
			while (batch.length < this.batchSize && !this.isEmpty()) {
				const item = this.dequeue();
				if (!item) break; // Queue is empty

				const result = await item.action(); // Execute the action
				batch.push(result);
				item.resolve(result); // Resolve the promise associated with add to queue.
			}
			return batch; // Return the batch of results
		} finally {
			this.processing = false;
			if (!this.isEmpty()) {
				void this.processBatch(); // Process the next batch in background
			}
		}
	}

	start(): Promise<boolean> {
		const result = super.start();
		void this.processBatch(); // Start processing batches
		return result;
	}

	addToQueue(action: () => Promise<T>, autoDequeue: boolean = true): Promise<T> {
		const promise = super.addToQueue(action, autoDequeue);
		if (!this.processing) {
			void this.processBatch();
		}
		return promise;
	}
}
