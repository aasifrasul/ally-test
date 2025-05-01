// Create a queue that allows concurrent processing of async tasks up until a limit.
// Tasks can be added to it after creation at any time. The queue has the following signature:

/*

type Task = any;

type Queue = (ProcessorFn, OnCompleteFn, concurrency: number) => QueueObject

type QueueObject = {
  drain: (error?: Error) => void
  push: (Task or Array<Task>, CallbackFn) => void
  error: (error?: Error, Task) => void
  unshift: (Task or Array<Task>, CallbackFn) => void
}

type ProcessorFn = (Task, CallbackFn) => void

type OnCompleteFn = (data: any, error: Error, Task) => void

type CallbackFn = (error?: Error) => void

const processorFn = (task, callback) => {
	setTimeout(() => {
	  console.log('Processing task ' + task.name);
	  callback(`${task.name} done`);
	}, 500);
}


const onCompleteFn = (data, error, task) => {
	console.log('Task has completed processing: ', task.name, error, Date.now());
}


*/
class Queue {
	constructor() {
		this.map = new Map();
		this.upperLimit = 0;
		this.lowerLimit = 0;
	}

	enqueue(item) {
		this.map.set(++this.upperLimit, item);
	}

	preQueue(item) {
		this.map.set(this.lowerLimit--, item);
	}

	dequeue() {
		if (this.isEmpty()) {
			return null;
		}

		const key = ++this.lowerLimit;
		const result = this.map.get(key);
		this.map.delete(key);
		return result;
	}

	isEmpty() {
		return this.map.size === 0;
	}
}

class ConcurrentQueue {
	constructor(processorFn, onCompleteFn, concurrency) {
		this.queue = new Queue();
		this.concurrency = concurrency;
		this.processorFn = processorFn;
		this.onCompleteFn = onCompleteFn;

		this.processingCount = 0;
	}

	processNext() {
		if (this.processingCount >= this.concurrency) return;

		const item = this.queue.dequeue();

		if (!item) return;

		this.processingCount++;

		if (typeof this.processorFn === 'function') {
			this.processorFn(item, (data, error) => {
				this.processingCount--;
				// This is for error handling
				if (error && typeof this.errorCallback === 'function') {
					this.errorCallback(error);
					return;
				}

				if (typeof this.onCompleteFn === 'function') {
					this.onCompleteFn(data, error, item);
				}

				if (this.queue.isEmpty() && typeof this.drainCallback === 'function') {
					this.drainCallback();
					return;
				}

				this.processNext();
			});
		}
	}

	push(tasks) {
		const items = Array.isArray(tasks) ? [...tasks] : [tasks];
		items.forEach((item) => this.queue.enqueue(item));
		items.forEach(() => this.processNext());
	}

	unshift(tasks) {
		const items = Array.isArray(tasks) ? [...tasks] : [tasks];
		items.reverse().forEach((item) => this.queue.preQueue(item));
		items.forEach(() => this.processNext());
	}

	drain(callbackFn) {
		this.drainCallback = callbackFn;
	}

	error(callbackFn) {
		this.errorCallback = callbackFn;
	}
}

const processorFn = (task, callback) => {
	setTimeout(() => {
		console.log('Processing task ' + task.name);
		callback(`${task.name} done`);
	}, 500);
};

const onCompleteFn = (data, error, task) => {
	console.log('Task has completed processing: ', data, error, Date.now());
};

const myQueue = new ConcurrentQueue(processorFn, onCompleteFn, 2);

// add some items to the queue
myQueue.push({ name: 'foo' });

// add some items to the queue (batch-wise)
myQueue.push([{ name: 'baz' }, { name: 'bay' }, { name: 'bax' }]);

// Add items after a certain timeout
setTimeout(() => {
	myQueue.push([{ name: 'x' }, { name: 'y' }, { name: 'z' }, { name: 'w' }]);
}, 500);

setTimeout(() => {
	myQueue.push([{ name: 'ab' }, { name: 'ce' }, { name: 'ef' }, { name: 'gh' }]);
}, 200);

myQueue.unshift([{ name: 'fsgsd' }, { name: 'fce' }, { name: 'sfsd' }, { name: 'ddfh' }]);

// assign a listener when the queue does not have any pending items
myQueue.drain(function () {
	console.log('all items have been processed');
});

myQueue.error(function (error, item) {
	console.log(`${item.name} errored ${error}`);
});
