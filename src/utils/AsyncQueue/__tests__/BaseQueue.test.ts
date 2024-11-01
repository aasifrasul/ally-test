import { BaseQueue } from '../BaseQueue';

describe('BaseQueue', () => {
	let queue: BaseQueue<number>;

	beforeEach(() => {
		queue = new BaseQueue<number>();
	});

	test('enqueue adds items to the queue', () => {
		queue.enqueue(1);
		queue.enqueue(2);
		expect(queue.size).toBe(2);
	});

	test('dequeue removes and returns items in FIFO order', () => {
		queue.enqueue(1);
		queue.enqueue(2);
		expect(queue.dequeue()).toBe(1);
		expect(queue.dequeue()).toBe(2);
		expect(queue.size).toBe(0);
	});

	test('peek returns the next item without removing it', () => {
		queue.enqueue(1);
		queue.enqueue(2);
		expect(queue.peek()).toBe(1);
		expect(queue.size).toBe(2);
	});

	test('isEmpty returns true for an empty queue', () => {
		expect(queue.isEmpty()).toBe(true);
		queue.enqueue(1);
		expect(queue.isEmpty()).toBe(false);
	});

	test('size returns the correct number of items', () => {
		expect(queue.size).toBe(0);
		queue.enqueue(1);
		queue.enqueue(2);
		expect(queue.size).toBe(2);
	});

	test('reset clears the queue', () => {
		queue.enqueue(1);
		queue.enqueue(2);
		queue.reset();
		expect(queue.size).toBe(0);
		expect(queue.isEmpty()).toBe(true);
	});

	test('dequeue returns undefined for an empty queue', () => {
		expect(queue.dequeue()).toBeUndefined();
	});

	test('peek returns undefined for an empty queue', () => {
		expect(queue.peek()).toBeUndefined();
	});
});
