import BaseQueue from './BaseQueue';

class AsyncQueue extends BaseQueue {
	constructor() {
		super();
		this._pendingPromise = false;
		this._stop = false;
		this._pause = false;
	}
	enqueue(action, autoDequeue = true) {
		return new Promise((resolve, reject) => {
			super.enqueue({ action, resolve, reject });
			autoDequeue && this.dequeue();
		});
	}

	async dequeue() {
		if (this._pendingPromise) return false;
		if (this._pause) return false;

		if (this._stop) {
			this.reset();
			this._stop = false;
			return false;
		}

		const item = super.dequeue();
		if (!item) return false;

		try {
			this._pendingPromise = true;
			const payload = await item?.action;
			item?.resolve(payload);
		} catch (e) {
			item.reject(e);
		} finally {
			this._pendingPromise = false;
			this.dequeue();
		}

		return true;
	}

	stop() {
		this._stop = true;
	}

	pause() {
		this._pause = true;
	}

	async start() {
		this._stop = false;
		this._pause = false;
		return await this.dequeue();
	}
}

export default AsyncQueue;
