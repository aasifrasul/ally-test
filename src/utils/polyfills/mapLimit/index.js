`Sample qs: Implement mapLimit, Task:
Implement mapLimit, a utility function that maps each input through an asynchronous iteratee function with a specified concurrencyLimit on concurrent operations.
Inputs:
inputs: An array of inputs.
concurrencyLimit: The maximum number of operations that can run concurrently.
iterateeCallback: An async function that processes each input. It takes input and callback as arguments, where callback is called with the processed output.
Output:
Once all inputs are processed, call the provided callback with an array of results  /  
`

function* range(start, stop, step) {
	let count = start;

	while (count <= stop) {
		yield count;
		count += step;
	}
}

function mapLimit(items, concurrencyLimit, iterateeCallback, finalCallback) {
	if (!Array.isArray(items)) {
		throw new Error('First param should be an array');
	}

	const itemsCount = items.length;

	if (itemsCount === 0) {
		return finalCallback(null, []);
	}

	if (typeof iterateeCallback !== 'function') {
		throw new Error('third param should be a function');
	}

	if (typeof finalCallback !== 'function') {
		throw new Error('fourth param should be a function');
	}
  
	const results = new Array(itemsCount);
	let runningCount = 0;   // Number of tasks currently running
	let completedCount = 0; // Number of tasks completed
	let index = 0;          // Next item index to process
	let hasError = false;   // Error flag
  
	// Start as many tasks as allowed by the concurrencyLimit
	function processNext() {
		// While we have items to process and haven't hit the concurrency limit
		while (runningCount < concurrencyLimit && index < itemsCount) {
			const currentIndex = index++;  // Capture current index for closure
			runningCount++;
	  
			// Execute the iteratee callback for this item
			iterateeCallback(items[currentIndex], (error, result) => {
				if (hasError) return;  // Skip if we already encountered an error
		
				if (error) {
					hasError = true;
					return finalCallback(error);
				}

				// Store result in the correct order
				results[currentIndex] = result;
				runningCount--;
				completedCount++;
		
				// If all items are processed, we're done
				if (completedCount === itemsCount) {
					return finalCallback(null, results);
				}
		
				// Otherwise, try to process more items
				processNext();
			});
		}
	}
  
	// Kick off the process
	processNext();
}

mapLimit([...range(1, 20, 2)], 2,
	// This is the iterateeCallback that processes each input
	(input, callback) => {
		setTimeout(() => {
			callback(null, input * 2); // First param is for errors, second is result
		}, Math.random() * 500);
	},
	// This is the finalCallback that receives all results
	(error, results) => {
		if (error) console.error(error);
		else console.log(results); // Should print [2, 4, 6, 8]
	}
);
