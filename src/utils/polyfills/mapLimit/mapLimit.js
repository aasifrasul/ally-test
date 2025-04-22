import { ConcurrentAsyncQueue } from '../../../utils/AsyncQueue/ConcurrentAsyncQueue';

`Sample qs: Implement mapLimit, Task:
Implement mapLimit, a utility function that maps each input through an asynchronous iteratee function with a specified limit on concurrent operations.
Inputs:
inputs: An array of inputs.
limit: The maximum number of operations that can run concurrently.
iterateeFn: An async function that processes each input. It takes input and callback as arguments, where callback is called with the processed output.
Output:
Once all inputs are processed, call the provided callback with an array of results  /  
`;

function* range(start, stop, step) {
	let count = start;

	while (count <= stop) {
		yield count;
		count += step;
	}
}

function mapLimit(items, limit, iterateeFn, finalCallback) {
	if (!Array.isArray(items)) {
		throw new Error('First param should be an array');
	}

	if (items.length === 0) {
		finalCallback([]);
		return;
	}

	if (typeof iterateeFn !== 'function') {
		throw new Error('third param should be a function');
	}

	if (typeof finalCallback !== 'function') {
		throw new Error('fourth param should be a function');
	}

	const results = new Array(items.length);
	let running = 0; // Number of tasks currently running
	let completed = 0; // Number of tasks completed
	let index = 0; // Next item index to process
	let hasError = false; // Error flag

	// Start as many tasks as allowed by the limit
	function startNext() {
		// While we have items to process and haven't hit the limit
		while (running < limit && index < items.length) {
			const currentIndex = index++; // Capture current index for closure
			running++;

			// Execute the iteratee function for this item
			iterateeFn(items[currentIndex], (error, result) => {
				if (hasError) return; // Skip if we already encountered an error

				if (error) {
					hasError = true;
					return finalCallback(error);
				}

				// Store result in the correct order
				results[currentIndex] = result;
				running--;
				completed++;

				// If all items are processed, we're done
				if (completed === items.length) {
					return finalCallback(null, results);
				}

				// Otherwise, try to process more items
				startNext();
			});
		}
	}

	// Kick off the process
	startNext();
}

mapLimit(
	[...range(1, 20, 2)],
	2,
	// This is the iterateeFn that processes each input
	(input, callback) => {
		setTimeout(() => {
			callback(null, input * 2); // First param is for errors, second is result
		}, 1000);
	},
	// This is the finalCallback that receives all results
	(error, results) => {
		if (error) console.error(error);
		else console.log(results); // Should print [2, 4, 6, 8]
	},
);
