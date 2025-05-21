type Key = number;

export class BaseQueue<T> {
	private map: Map<Key, T> = new Map();
	private upperLimit: Key = 0;
	private lowerLimit: Key = 0;

	constructor() {
		this.reset();
	}

	enqueue(item: T): void {
		if (item === undefined || item === null) {
			throw new Error('Cannot enqueue null or undefined values.');
		}
		this.map.set(++this.upperLimit, item);
	}

	prequeue(item: T): void {
		if (item === undefined || item === null) {
			throw new Error('Cannot enqueue null or undefined values.');
		}
		this.map.set(this.lowerLimit--, item);
	}

	dequeue(): T | undefined {
		if (this.isEmpty()) {
			return undefined;
		}

		const key = this.lowerLimit + 1;
		const result = this.map.get(key);
		this.map.delete(key);
		this.lowerLimit++;

		return result;
	}

	*[Symbol.iterator]() {
		for (const value of this.map.values()) {
			yield value;
		}
	}

	peek(): T | undefined {
		if (this.isEmpty()) {
			return undefined;
		}
		return this.map.get(this.lowerLimit + 1);
	}

	reset(): void {
		this.map.clear();
		this.upperLimit = 0;
		this.lowerLimit = 0;
	}

	get size(): number {
		return this.map.size;
	}

	isEmpty(): boolean {
		return this.size === 0;
	}
}
