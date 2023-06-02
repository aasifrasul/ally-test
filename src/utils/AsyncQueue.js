class Queue {
	constructor() {
		this.items = [];
	}
	enqueue(item) {
		this.items.push(item);
	}
	dequeue() {
		return this.items.shift();
	}
	get size() {
		return this.items.length;
	}
}

class AsyncQueue extends Queue {
	constructor() {
		super();
		this.pendingPromise = false;
	}

	enqueue(action) {
		return new Promise((resolve, reject) => {
			super.enqueue({ action, resolve, reject });
			this.dequeue();
		});
	}

	async dequeue() {
		if (this.pendingPromise) return false;

		const item = super.dequeue();
		if (!item) return false;

		try {
			this.pendingPromise = true;
			const payload = await item.action;
			item.resolve(payload);
		} catch (e) {
			item.reject(e);
		} finally {
			this.pendingPromise = false;
			this.dequeue();
		}

		return true;
	}
}

export default AsyncQueue;
