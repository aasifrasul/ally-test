import { isObject } from './typeChecking';

interface QueueInstance {
	hash: Map<number, any>;
	count: number;
	lowestCount: number;
	reset(): void;
	increment(key: keyof QueueInstance): number;
	decrement(key: keyof QueueInstance): number;
	enqueue(data: any, priority?: boolean): void;
	dequeue(): any | undefined;
	size(): number;
}

class Queue implements QueueInstance {
	private static instance: Queue;
	public hash!: Map<number, any>;
	public count!: number;
	public lowestCount!: number;

	private constructor() {
		this.reset();
	}

	public static getInstance(): Queue {
		if (!Queue.instance) {
			Queue.instance = new Queue();
		}
		return Queue.instance;
	}

	public reset(): void {
		console.log('Queue is reset');
		this.hash = new Map<number, any>();
		this.count = 0;
		this.lowestCount = 0;
	}

	public increment(key: keyof Queue): number {
		return (this[key] as number) + 1;
	}

	public decrement(key: keyof Queue): number {
		return (this[key] as number) - 1;
	}

	public enqueue(data: any, priority?: boolean): void {
		if (!data) {
			return;
		}

		const key = priority ? --this.lowestCount : this.count++;
		this.hash.set(key, data);
	}

	public dequeue(): any | undefined {
		if (this.size() === 0) {
			this.reset();
			return undefined;
		}

		const result = this.hash.get(this.lowestCount);
		this.hash.delete(this.lowestCount);
		this.increment('lowestCount');
		return result;
	}

	public size(): number {
		return this.count - this.lowestCount;
	}
}

const queue = Queue.getInstance();

export default queue;
