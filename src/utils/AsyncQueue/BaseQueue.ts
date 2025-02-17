export class BaseQueue<T> {
	protected map: Map<number, T> = new Map();
	protected upperLimit = 0;
	protected lowerLimit = 0;

	constructor() {
		this.reset();
	}

	enqueue(item: T): void {
		if (item !== undefined && item !== null) {
			this.map.set(++this.upperLimit, item);
		}
	}

	dequeue(): T | undefined {
		if (this.isEmpty()) {
			return undefined;
		}

		const key = this.lowerLimit + 1;
		const result = this.map.get(key);
		this.map.delete(key);
		this.lowerLimit = key;

		return result;
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
