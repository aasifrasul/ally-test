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

		this.items.set(priority, item);
	}

	dequeue() {
		if (this.isEmpty()) {
			console.log('Underflow');
			return;
		}

		const item = this.items.get(this.lowerLimit);
		this.items.delete(this.lowerLimit);
		++this.lowerLimit;
		return item;
	}

	front() {
		if (this.isEmpty()) {
			console.log('No elements in Queue');
			return;
		}
		return this.items.get(this.lowerLimit);
	}

	rear() {
		if (this.isEmpty()) {
			console.log('No elements in Queue');
			return;
		}
		return this.items.get(this.upperLimit);
	}

	printPQueue() {
		return [...this.items.keys()]
			?.sort()
			?.map((key) => this.items.get(key))
			?.join(' -> ');
	}

	reset() {
		this.items = new Map();
		this.lowerLimit = 0;
		this.upperLimit = 0;
	}

	get size() {
		return this.items.size;
	}

	isEmpty() {
		return this.size === 0;
	}
}

export default PriorityQueue;
