/**
 * A comprehensive collection of async utility functions for managing concurrency
 * These functions are similar to the ones found in libraries like async.js
 */

// Core async control functions
const asyncUtils = {
	/**
	 * Runs tasks in sequence, passing results to the next function
	 * @param {Array<Function>} tasks - Array of functions that take a callback(err, result)
	 * @param {Function} callback - Final callback with the result of the last task
	 */
	waterfall(tasks, callback) {
		if (!Array.isArray(tasks)) {
			return callback(new Error('First param must be an array of functions'));
		}

		if (tasks.length === 0) {
			return callback(null);
		}

		let taskIndex = 0;

		function next(...args) {
			if (taskIndex === tasks.length) {
				return callback(...args);
			}

			const err = args[0];
			if (err) {
				return callback(err);
			}

			const currentTask = tasks[taskIndex++];
			const nextArgs = args.slice(1);

			try {
				// Pass next as callback and previous results as arguments
				nextArgs.push(next);
				currentTask(...nextArgs);
			} catch (e) {
				callback(e);
			}
		}

		// Start the first task with no arguments except the callback
		next(null);
	},

	/**
	 * Runs tasks in sequence, collecting all results
	 * @param {Array<Function>} tasks - Array of functions that take a callback(err, result)
	 * @param {Function} callback - Final callback with all results
	 */
	series(tasks, callback) {
		if (!Array.isArray(tasks)) {
			return callback(new Error('First param must be an array of functions'));
		}

		const results = [];
		let completed = 0;

		if (tasks.length === 0) {
			return callback(null, results);
		}

		tasks.forEach((task, index) => {
			const taskCallback = (err, result) => {
				if (err) {
					// Short circuit with the error
					const cb = callback;
					callback = () => {}; // Prevent multiple callbacks
					return cb(err);
				}

				results[index] = result;
				completed++;

				if (completed === tasks.length) {
					callback(null, results);
				}
			};

			// We execute the task only when it's its turn
			if (index === 0) {
				executeTask(task, taskCallback);
			} else {
				// Wait for the previous task to complete before executing this one
				const prevTaskCallback = tasks[index - 1];
				tasks[index - 1] = (cb) => {
					prevTaskCallback((err, res) => {
						if (err) return cb(err);
						cb(null, res);
						// Execute the next task
						executeTask(task, taskCallback);
					});
				};
			}
		});

		function executeTask(task, cb) {
			try {
				task(cb);
			} catch (e) {
				cb(e);
			}
		}
	},

	/**
	 * Runs tasks in parallel
	 * @param {Array<Function>} tasks - Array of functions that take a callback(err, result)
	 * @param {Function} callback - Final callback with all results
	 */
	parallel(tasks, callback) {
		if (!Array.isArray(tasks)) {
			return callback(new Error('First param must be an array of functions'));
		}

		const results = new Array(tasks.length);
		let completed = 0;
		let hasError = false;

		if (tasks.length === 0) {
			return callback(null, results);
		}

		tasks.forEach((task, index) => {
			try {
				task((err, result) => {
					if (hasError) return;

					if (err) {
						hasError = true;
						return callback(err);
					}

					results[index] = result;
					completed++;

					if (completed === tasks.length) {
						callback(null, results);
					}
				});
			} catch (e) {
				if (!hasError) {
					hasError = true;
					callback(e);
				}
			}
		});
	},

	/**
	 * Runs tasks in parallel with a concurrency limit
	 * @param {Array<Function>} tasks - Array of functions that take a callback(err, result)
	 * @param {number} limit - Maximum number of tasks to run in parallel
	 * @param {Function} callback - Final callback with all results
	 */
	parallelLimit(tasks, limit, callback) {
		if (!Array.isArray(tasks)) {
			return callback(new Error('First param must be an array of functions'));
		}

		if (typeof limit !== 'number' || limit <= 0) {
			return callback(new Error('Limit must be a positive number'));
		}

		const results = new Array(tasks.length);
		let running = 0;
		let completed = 0;
		let taskIndex = 0;
		let hasError = false;

		if (tasks.length === 0) {
			return callback(null, results);
		}

		function startNext() {
			while (running < limit && taskIndex < tasks.length) {
				const index = taskIndex++;
				running++;

				try {
					tasks[index]((err, result) => {
						if (hasError) return;

						if (err) {
							hasError = true;
							return callback(err);
						}

						results[index] = result;
						running--;
						completed++;

						if (completed === tasks.length) {
							callback(null, results);
						} else {
							startNext();
						}
					});
				} catch (e) {
					running--;
					if (!hasError) {
						hasError = true;
						callback(e);
					}
				}
			}
		}

		startNext();
	},

	/**
	 * Creates a queue with specified concurrency
	 * @param {Function} worker - Worker function to process items
	 * @param {number} concurrency - Max number of simultaneous workers
	 * @returns {Object} Queue object with push and drain methods
	 */
	queue(worker, concurrency = 1) {
		if (typeof worker !== 'function') {
			throw new Error('Worker must be a function');
		}

		if (typeof concurrency !== 'number' || concurrency <= 0) {
			throw new Error('Concurrency must be a positive number');
		}

		const tasks = [];
		let workers = 0;
		let drainCallback = null;
		let isProcessing = false;

		function processQueue() {
			if (isProcessing) return;
			isProcessing = true;

			while (workers < concurrency && tasks.length > 0) {
				const task = tasks.shift();
				workers++;

				try {
					worker(task.data, (err, result) => {
						workers--;

						if (task.callback) {
							task.callback(err, result);
						}

						if (workers === 0 && tasks.length === 0 && drainCallback) {
							drainCallback();
						}

						processQueue();
					});
				} catch (e) {
					workers--;
					if (task.callback) {
						task.callback(e);
					}
					processQueue();
				}
			}

			isProcessing = false;
		}

		return {
			push(data, callback) {
				tasks.push({ data, callback });
				processQueue();
				return this;
			},

			drain(callback) {
				drainCallback = callback;
				if (workers === 0 && tasks.length === 0) {
					callback();
				}
				return this;
			},

			length() {
				return tasks.length;
			},

			running() {
				return workers;
			},
		};
	},

	/**
	 * Maps items through an async function with concurrency limit
	 * @param {Array} items - Array of items to process
	 * @param {number} limit - Maximum number of concurrent operations
	 * @param {Function} iteratee - Async function to process each item
	 * @param {Function} callback - Final callback with results
	 */
	mapLimit(items, limit, iteratee, callback) {
		if (!Array.isArray(items)) {
			return callback(new Error('First param should be an array'));
		}

		if (typeof iteratee !== 'function') {
			return callback(new Error('Third param should be a function'));
		}

		const itemsCount = items.length;
		if (itemsCount === 0) {
			return callback(null, []);
		}

		const results = new Array(itemsCount);
		let runningCount = 0;
		let completedCount = 0;
		let index = 0;
		let hasError = false;

		function processNext() {
			while (runningCount < limit && index < itemsCount) {
				const currentIndex = index++;
				runningCount++;

				try {
					iteratee(items[currentIndex], (error, result) => {
						if (hasError) return;

						if (error) {
							hasError = true;
							return callback(error);
						}

						results[currentIndex] = result;
						runningCount--;
						completedCount++;

						if (completedCount === itemsCount) {
							return callback(null, results);
						}

						processNext();
					});
				} catch (e) {
					runningCount--;
					if (!hasError) {
						hasError = true;
						callback(e);
					}
				}
			}
		}

		processNext();
	},

	/**
	 * Applies the iteratee to each item in parallel, with concurrency limit
	 * @param {Array} items - Array of items to process
	 * @param {number} limit - Maximum number of concurrent operations
	 * @param {Function} iteratee - Async function to process each item
	 * @param {Function} callback - Final callback when all items processed
	 */
	eachLimit(items, limit, iteratee, callback) {
		if (!Array.isArray(items)) {
			return callback(new Error('First param should be an array'));
		}

		this.mapLimit(
			items,
			limit,
			(item, cb) => {
				iteratee(item, (err) => cb(err));
			},
			callback,
		);
	},

	/**
	 * Filters items based on async test with concurrency limit
	 * @param {Array} items - Array of items to filter
	 * @param {number} limit - Maximum number of concurrent operations
	 * @param {Function} iteratee - Async test function returning boolean
	 * @param {Function} callback - Final callback with filtered items
	 */
	filterLimit(items, limit, iteratee, callback) {
		if (!Array.isArray(items)) {
			return callback(new Error('First param should be an array'));
		}

		this.mapLimit(
			items,
			limit,
			(item, cb) => {
				iteratee(item, (err, result) => {
					cb(err, !!result); // Convert result to boolean
				});
			},
			(err, results) => {
				if (err) return callback(err);

				const filtered = items.filter((_, index) => results[index]);
				callback(null, filtered);
			},
		);
	},

	/**
	 * Reduces collection using async iteratee with concurrency limit
	 * @param {Array} items - Array of items to reduce
	 * @param {*} memo - Initial accumulator value
	 * @param {number} limit - Maximum number of concurrent operations
	 * @param {Function} iteratee - Async function to process (memo, item, callback)
	 * @param {Function} callback - Final callback with reduced value
	 */
	reduceLimit(items, memo, limit, iteratee, callback) {
		if (!Array.isArray(items)) {
			return callback(new Error('First param should be an array'));
		}

		if (typeof iteratee !== 'function') {
			return callback(new Error('Fourth param should be a function'));
		}

		const q = this.queue((task, cb) => {
			iteratee(task.memo, task.item, (err, result) => {
				cb(err, result);
			});
		}, limit);

		let result = memo;
		let index = 0;
		let completed = 0;
		let hasError = false;

		function processNext() {
			if (index >= items.length) return;

			const currentIndex = index++;
			q.push(
				{
					memo: result,
					item: items[currentIndex],
				},
				(err, newMemo) => {
					if (hasError) return;

					if (err) {
						hasError = true;
						return callback(err);
					}

					result = newMemo;
					completed++;

					if (completed === items.length) {
						callback(null, result);
					} else {
						processNext();
					}
				},
			);
		}

		for (let i = 0; i < Math.min(limit, items.length); i++) {
			processNext();
		}

		if (items.length === 0) {
			callback(null, memo);
		}
	},
};

// Example usage:
// 1. Waterfall Example - Tasks executed in sequence, results passed to next task
asyncUtils.waterfall(
	[
		(callback) => {
			setTimeout(() => {
				callback(null, 'Task 1 result');
			}, 300);
		},
		(task1Result, callback) => {
			setTimeout(() => {
				callback(null, task1Result + ' -> Task 2 result');
			}, 200);
		},
		(task2Result, callback) => {
			setTimeout(() => {
				callback(null, task2Result + ' -> Task 3 result');
			}, 100);
		},
	],
	(err, result) => {
		if (err) console.error(err);
		console.log('Waterfall result:', result);
		// Outputs: 'Task 1 result -> Task 2 result -> Task 3 result'
	},
);

// 2. Series Example - Tasks executed in sequence, all results collected
asyncUtils.series(
	[
		(callback) => {
			setTimeout(() => {
				callback(null, 'Series task 1');
			}, 300);
		},
		(callback) => {
			setTimeout(() => {
				callback(null, 'Series task 2');
			}, 200);
		},
		(callback) => {
			setTimeout(() => {
				callback(null, 'Series task 3');
			}, 100);
		},
	],
	(err, results) => {
		if (err) console.error(err);
		console.log('Series results:', results);
		// Outputs: ['Series task 1', 'Series task 2', 'Series task 3']
	},
);

// 3. Parallel Example - Tasks executed concurrently
asyncUtils.parallel(
	[
		(callback) => {
			setTimeout(() => {
				callback(null, 'Parallel task 1');
			}, 300);
		},
		(callback) => {
			setTimeout(() => {
				callback(null, 'Parallel task 2');
			}, 200);
		},
		(callback) => {
			setTimeout(() => {
				callback(null, 'Parallel task 3');
			}, 100);
		},
	],
	(err, results) => {
		if (err) console.error(err);
		console.log('Parallel results:', results);
		// Outputs: ['Parallel task 1', 'Parallel task 2', 'Parallel task 3']
	},
);

// 4. ParallelLimit Example - Limited concurrent execution
asyncUtils.parallelLimit(
	[
		(callback) => {
			setTimeout(() => {
				callback(null, 'ParallelLimit task 1');
			}, 300);
		},
		(callback) => {
			setTimeout(() => {
				callback(null, 'ParallelLimit task 2');
			}, 200);
		},
		(callback) => {
			setTimeout(() => {
				callback(null, 'ParallelLimit task 3');
			}, 100);
		},
		(callback) => {
			setTimeout(() => {
				callback(null, 'ParallelLimit task 4');
			}, 150);
		},
	],
	2,
	(err, results) => {
		if (err) console.error(err);
		console.log('ParallelLimit results:', results);
	},
);

// 5. Queue Example - Processing a queue with concurrency control
const imageProcessingQueue = asyncUtils.queue((imageData, callback) => {
	console.log(`Processing image: ${imageData.id}`);
	setTimeout(() => {
		console.log(`Finished processing image: ${imageData.id}`);
		callback(null, { id: imageData.id, status: 'processed' });
	}, imageData.processingTime);
}, 2); // Process 2 images concurrently

imageProcessingQueue.drain(() => {
	console.log('All images have been processed');
});

// Add items to the queue
[
	{ id: 'img1', processingTime: 300 },
	{ id: 'img2', processingTime: 200 },
	{ id: 'img3', processingTime: 400 },
	{ id: 'img4', processingTime: 100 },
].forEach((img) => {
	imageProcessingQueue.push(img, (err, result) => {
		if (err) console.error(`Error processing image ${img.id}:`, err);
		else console.log(`Image processing result:`, result);
	});
});

// 6. MapLimit Example - Map over array with concurrency limit
const urls = [
	'https://api.example.com/1',
	'https://api.example.com/2',
	'https://api.example.com/3',
	'https://api.example.com/4',
	'https://api.example.com/5',
];

function simulateFetch(url, callback) {
	console.log(`Fetching: ${url}`);
	setTimeout(() => {
		callback(null, `Response from ${url}`);
	}, Math.random() * 1000);
}

asyncUtils.mapLimit(urls, 2, simulateFetch, (err, results) => {
	if (err) console.error(err);
	console.log('MapLimit results:', results);
});

// 7. FilterLimit Example - Filter items based on async test
const files = [
	{ name: 'file1.txt', size: 12000 },
	{ name: 'file2.txt', size: 5000 },
	{ name: 'file3.txt', size: 8000 },
	{ name: 'file4.txt', size: 3000 },
	{ name: 'file5.txt', size: 15000 },
];

asyncUtils.filterLimit(
	files,
	2,
	(file, callback) => {
		// Simulate async file size check
		setTimeout(() => {
			callback(null, file.size > 7000); // Keep files larger than 7KB
		}, Math.random() * 300);
	},
	(err, results) => {
		if (err) console.error(err);
		console.log('FilterLimit results (files > 7KB):', results);
	},
);

// 8. ReduceLimit Example - Process items sequentially with a limit
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

asyncUtils.reduceLimit(
	numbers,
	0, // Initial value
	2, // Concurrency limit
	(memo, item, callback) => {
		// Simulate async calculation
		setTimeout(() => {
			console.log(`Adding ${item} to ${memo}`);
			callback(null, memo + item);
		}, Math.random() * 200);
	},
	(err, result) => {
		if (err) console.error(err);
		console.log('ReduceLimit final sum:', result);
	},
);
