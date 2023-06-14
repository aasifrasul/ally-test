class PriorityQueue {
	constructor() {
		this.reset();
	}

	enqueue(item, priority) {
		if (this.isEmpty()) {
			this.lowerLimit = priority;
			this.upperLimit = priority;
		} else if (priority < this.lowerLimit) {
			this.lowerLimit = priority;
		} else if (priority > this.upperLimit) {
			this.upperLimit = priority;
		}

		this.map.set(priority, item);
	}

	dequeue() {
		if (this.isEmpty()) {
			console.log('Underflow');
			return;
		}

		const item = this.map.get(this.lowerLimit);
		this.map.delete(this.lowerLimit);
		++this.lowerLimit;
		return item;
	}

	front() {
		if (this.isEmpty()) {
			console.log('No elements in Queue');
			return;
		}
		return this.map.get(this.lowerLimit);
	}

	rear() {
		if (this.isEmpty()) {
			console.log('No elements in Queue');
			return;
		}
		return this.map.get(this.upperLimit);
	}

	printPQueue() {
		return [...this.map.keys()]
			?.sort()
			?.map((key) => this.map.get(key))
			?.join(' -> ');
	}

	reset() {
		this.map = new Map();
		this.lowerLimit = 0;
		this.upperLimit = 0;
	}

	get size() {
		return this.map.size;
	}

	isEmpty() {
		return this.map.size === 0;
	}
}

export default PriorityQueue;
