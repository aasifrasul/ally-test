import { AsyncQueue } from '../';

describe('AsyncQueue', () => {
	let queue: AsyncQueue<number>;

	beforeEach(() => {
		queue = new AsyncQueue<number>();
	});

	it('should process items in order', async () => {
		const results: number[] = [];

		// Add multiple items to the queue
		const promises = [
			queue.addToQueue(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				results.push(1);
				return 1;
			}),
			queue.addToQueue(async () => {
				results.push(2);
				return 2;
			}),
			queue.addToQueue(async () => {
				results.push(3);
				return 3;
			}),
		];

		// Wait for all promises to resolve
		const values = await Promise.all(promises);

		expect(results).toEqual([1, 2, 3]);
		expect(values).toEqual([1, 2, 3]);
	});

	it('should handle errors properly', async () => {
		const errorMessage = 'Test error';

		// Add a failing action
		const failingPromise = queue.addToQueue(async () => {
			throw new Error(errorMessage);
		});

		await expect(failingPromise).rejects.toThrow(errorMessage);

		// Verify queue continues processing after error
		const successPromise = queue.addToQueue(async () => 42);
		const result = await successPromise;

		expect(result).toBe(42);
	});

	it('should respect pause and resume', async () => {
		const results: number[] = [];

		// Add an item and pause immediately
		const promise1 = queue.addToQueue(async () => {
			results.push(1);
			return 1;
		});

		queue.pause();

		// Add more items while paused
		const promise2 = queue.addToQueue(async () => {
			results.push(2);
			return 2;
		});

		// First item should complete, second should not
		await promise1;
		expect(results).toEqual([1]);

		// Resume processing
		await queue.start();
		await promise2;

		expect(results).toEqual([1, 2]);
	});

	it('should stop processing when stopped', async () => {
		const results: number[] = [];

		// Add items and stop the queue
		await queue.addToQueue(async () => {
			results.push(1);
			return 1;
		});

		queue.stop();

		const promise = queue.addToQueue(async () => {
			results.push(2);
			return 2;
		});

		// Second item should not be processed
		expect(results).toEqual([1]);

		// Resume processing
		await queue.start();
		await promise;

		expect(results).toEqual([1, 2]);
	});

	it('should process items added while processing', async () => {
		const results: number[] = [];

		// Add an item that will add another item
		const promise1 = queue.addToQueue(async () => {
			results.push(1);

			// Add another item while processing
			void queue.addToQueue(async () => {
				results.push(2);
				return 2;
			});

			return 1;
		});

		await promise1;
		// Wait for any pending operations
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(results).toEqual([1, 2]);
	});

	it('should handle autoDequeue flag', async () => {
		const results: number[] = [];

		// Add items with autoDequeue = false
		const promise1 = queue.addToQueue(async () => {
			results.push(1);
			return 1;
		}, false);

		const promise2 = queue.addToQueue(async () => {
			results.push(2);
			return 2;
		}, false);

		// Nothing should be processed yet
		expect(results).toEqual([]);

		// Manually start processing
		await queue.processQueue();
		await Promise.all([promise1, promise2]);

		expect(results).toEqual([1, 2]);
	});
});
