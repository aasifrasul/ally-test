const Queue = (function () {
	const Queue = function Queue() {
		if (Queue.instance) {
			// Singleton
			console.log('Return the existing instance');
			return Queue.instance;
		}
		this.reset();
		Queue.instance = this;
	};

	Queue.prototype.reset = function () {
		console.log('Queue is reset');
		this.hash = new Map();
		this.count = 0;
		this.lowestCount = 0;
	};

	Queue.prototype.increment = function (key) {
		return (this[key] = this[key] + 1);
	};

	Queue.prototype.decrement = function (key) {
		return (this[key] = this[key] - 1);
	};

	Queue.prototype.enqueue = function (data, priority) {
		if (!data) {
			return;
		}

		const key = priority ? --this.lowestCount : this.count++;

		this.hash.set(key, data);
	};

	Queue.prototype.dequeue = function () {
		if (this.size() === 0) {
			this.reset();
			return;
		}

		const result = this.hash.get(this.lowestCount);
		this.hash.delete(this.lowestCount);
		this.increment('lowestCount');
		return result;
	};

	Queue.prototype.size = function () {
		return this.count - this.lowestCount;
	};

	return Queue;
})();

const queue = new Queue();

self.addEventListener(
	'message',
	(e) => {
		console.log('Data received from main Thread', e.data);
	},
	false,
);

self.postMessage('From WebWorker');
