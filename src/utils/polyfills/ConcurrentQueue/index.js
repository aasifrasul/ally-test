function concurrentQueue(processorFn, onCompleteFn, concurrency) {
	let drainCallback = null;
	let errorCallback = null;

	let processorCallback =
		typeof processorFn === 'function'
			? processorFn
			: () => console.log('processorFn is not proper');
	let completionCallback =
		typeof onCompleteFn === 'function'
			? onCompleteFn
			: () => console.log('onCompleteFn is not proper');

	let runningCount = 0;
	let index = 0;
	const items = [];

	function processNext() {
		while (items.length > 0 && runningCount < concurrency) {
			runningCount++;

			const currentItem = items.shift();

			processorCallback(currentItem, (error, data) => {
				runningCount--;

				if (error) return errorCallback(error, currentItem);

				completionCallback(data, error, currentItem);

				if (0 === items.length) return drainCallback();

				processNext();
			});
		}
	}

	function push(tasks) {
		const newItems = Array.isArray(tasks) ? [...tasks] : [tasks];
		items.push(...newItems);
		processNext();
	}

	function unshift(tasks) {
		const newItems = Array.isArray(tasks) ? [...tasks] : [tasks];
		items.unshift(...newItems);
		processNext();
	}

	function drain(callbackFn) {
		drainCallback =
			typeof callbackFn === 'function'
				? callbackFn
				: () => console.log('drain Callabck Fn is not proper');
	}

	function error(callbackFn) {
		errorCallback =
			typeof callbackFn === 'function'
				? callbackFn
				: () => console.log('error Callabck Fn is not proper');
	}

	return {
		drain,
		push,
		error,
		unshift,
	};
}

const processorFn = (task, callback) => {
	setTimeout(() => {
		console.log('Processing task ' + task.name);
		callback(null, `${task.name} done`);
	}, 500);
};

const onCompleteFn = (data, error, task) => {
	console.log('Task has completed processing: ', data, error, Date.now());
};

const myQueue = concurrentQueue(processorFn, onCompleteFn, 2);

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

setTimeout(() => {
	myQueue.unshift([{ name: 'fsgsd' }, { name: 'fce' }, { name: 'sfsd' }, { name: 'ddfh' }]);
}, 500);

// assign a listener when the queue does not have any pending items
myQueue.drain(function () {
	console.log('all items have been processed');
});

myQueue.error(function (error, item) {
	console.log(`${item.name} errored ${error}`);
});
