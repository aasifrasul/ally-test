import { AsyncQueue, QueueItem } from './index';

interface PriorityQueueItem<T> extends QueueItem<T> {
	priority: number;
}

class PriorityAsyncQueue<T> extends AsyncQueue<T> {
	protected map: Map<number, PriorityQueueItem<T>> = new Map();

	addToQueue(
		action: () => Promise<T>,
		autoDequeue: boolean = true,
		priority: number = 0,
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const newItem: PriorityQueueItem<T> = { action, resolve, reject, priority };
			let inserted = false;
			if (this.isEmpty()) {
				this.map.set(++this.upperLimit, newItem);
				inserted = true;
			} else {
				for (let i = this.lowerLimit + 1; i <= this.upperLimit; i++) {
					const existingItem = this.map.get(i);
					if (existingItem && priority > existingItem.priority) {
						// Insert the new item before the current item
						const newMap = new Map<number, PriorityQueueItem<T>>();
						for (let j = this.lowerLimit + 1; j < i; j++) {
							const temp = this.map.get(j);
							if (temp) newMap.set(j, temp);
						}
						newMap.set(i, newItem);
						for (let j = i; j <= this.upperLimit; j++) {
							const temp = this.map.get(j);
							if (temp) newMap.set(j + 1, temp);
						}
						this.map = newMap;
						this.upperLimit++;
						inserted = true;
						break;
					}
				}
				if (!inserted) {
					this.map.set(++this.upperLimit, newItem);
				}
			}

			if (autoDequeue) {
				void this.processQueue();
			}
		});
	}

	dequeue(): PriorityQueueItem<T> | undefined {
		if (this.isEmpty()) {
			return undefined;
		}

		let highestPriorityKey: number | undefined = undefined;
		let highestPriority: number = -Infinity;

		for (const [key, item] of this.map) {
			if (highestPriorityKey === undefined || item.priority > highestPriority) {
				highestPriorityKey = key;
				highestPriority = item.priority;
			}
		}

		if (highestPriorityKey === undefined) return undefined;
		const result = this.map.get(highestPriorityKey);
		this.map.delete(highestPriorityKey);

		// Adjust lowerLimit and upperLimit to keep track of the queue boundaries
		if (highestPriorityKey === this.lowerLimit + 1 && this.map.size > 0) {
			this.lowerLimit = Math.min(...this.map.keys());
		} else if (this.map.size === 0) {
			this.lowerLimit = 0;
			this.upperLimit = 0;
		}

		return result;
	}

	async processQueue(): Promise<boolean> {
		if (this.isEmpty() || this.isRunning || this.isPaused || this.isStopped) {
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
			this.isRunning = false;
			void this.processQueue();
		}
		return true;
	}
}

// Example Usage:
const priorityQueue = new PriorityAsyncQueue<string>();

priorityQueue.addToQueue(async () => 'High Priority 1', true, 2);
priorityQueue.addToQueue(async () => 'Low Priority 1', true, 0);
priorityQueue.addToQueue(async () => 'High Priority 2', true, 2);
priorityQueue.addToQueue(async () => 'Medium Priority 1', true, 1);
priorityQueue.addToQueue(async () => 'Low Priority 2', true, 0);

priorityQueue.start().then(() => {
	console.log('Queue processing finished.');
});
