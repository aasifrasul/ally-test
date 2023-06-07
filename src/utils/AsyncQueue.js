class Queue {
	constructor() {
		this.reset();
	}
	enqueue(item) {
		item && this.hash.set(++this.upperLimit, item);
	}
	dequeue() {
		if (this.size === 0) {
			return;
		}

		const result = this.hash.get(++this.lowerLimit);
		this.hash.delete(this.lowerLimit);
		return result;
	}
	reset() {
		this.hash = new Map();
		this.upperLimit = 0;
		this.lowerLimit = 0;
	}
	get size() {
		return Object.keys(this).length;
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
			const payload = await item?.action;
			item?.resolve(payload);
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
