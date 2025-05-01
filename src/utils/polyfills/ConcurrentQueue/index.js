function concurrentQueue(processorFn, onCompleteFn, concurrency) {
	const items = [];
	let drainCallback = null;
	let errorCallback = null;
	let runningCount = 0;
	let index = 0;

	function processNext() {
		while (items.length > 0 && runningCount < concurrency) {
			runningCount++;

			const currentItem = items.shift();

			processorFn(currentItem, (error, data) => {
				runningCount--;

				if (error) {
					typeof errorCallback === 'function' && errorCallback(error, currentItem);
					return;
				}

				typeof onCompleteFn === 'function' && onCompleteFn(data, error, currentItem);

				if (0 === items.length) {
					typeof drainCallback === 'function' && drainCallback();
					return;
				}

				processNext();
			});
		}
	}

	function push(tasks) {
		const newItems = Array.isArray(tasks) ? [...tasks] : [tasks];
		items.push(...newItems);
		processNext();
	}

	function unshift(tasks, callbackFn) {
		const newItems = Array.isArray(tasks) ? [...tasks] : [tasks];
		items.unshift(...newItems);
		processNext();
	}

	function drain(callbackFn) {
		drainCallback = callbackFn;
	}

	function error(callbackFn) {
		errorCallback = callbackFn;
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
