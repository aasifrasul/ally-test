class EventQueueManager {
	constructor() {
		this.map = new Map();
		this.upperLimit = 0;
		this.lowerLimit = 0;
	}

	enqueue(item) {
		const enhancedItem = {
			...item,
			id: `event_${++this.upperLimit}_${Date.now()}`,
			timestamp: item.timestamp || new Date().toISOString(),
			queuedAt: Date.now(),
		};
		this.map.set(this.upperLimit, enhancedItem);
		return enhancedItem.id;
	}

	dequeue() {
		if (this.isEmpty()) return null;

		const key = ++this.lowerLimit;
		const result = this.map.get(key);
		this.map.delete(key);
		return result;
	}

	getEvents(count) {
		const events = [];
		const actualCount = Math.min(count, this.size());

		for (let i = 0; i < actualCount; i++) {
			events.push(this.dequeue());
		}

		return events;
	}

	peek() {
		if (this.isEmpty()) return null;
		return this.map.get(this.lowerLimit + 1);
	}

	isEmpty() {
		return this.size() === 0;
	}

	size() {
		return this.map.size;
	}

	clear() {
		this.map.clear();
	}
}
