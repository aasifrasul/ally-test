class BaseQueue {
	constructor() {
		this.reset();
	}
	enqueue(item) {
		item && this.map.set(++this.upperLimit, item);
	}
	dequeue() {
		if (this.size === 0) {
			return;
		}

		const result = this.map.get(++this.lowerLimit);
		this.map.delete(this.lowerLimit);
		return result;
	}
	reset() {
		this.map = new Map();
		this.upperLimit = 0;
		this.lowerLimit = 0;
	}
	get size() {
		return this.map.size;
	}

	isEmpty() {
		return this.map.size === 0;
	}
}

export default BaseQueue;
