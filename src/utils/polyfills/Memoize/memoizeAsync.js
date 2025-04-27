/**
Implement the memoize function which optimizes repeated calls to an asynchronous
 function by caching the results. The memoize function takes an asynchronous function
 (asynchronousFunction) as an argument. This function takes n arguments, where the last argument is a
 callback in the form of callback(error, result).
The goal is that calling memoizedGetSomeData multiple times with the same arguments should trigger the
 callback with the same cached result, avoiding unnecessary expensive calls etc..
*/
export const memoizeAsync = (function () {
	const allCaches = new WeakMap();

	return function outer(asyncFn) {
		if (typeof asyncFn !== 'function') {
			throw new Error('First argument should be a function');
		}

		if (!allCaches.has(asyncFn)) {
			allCaches.set(asyncFn, new Map());
		}

		const cache = allCaches.get(asyncFn);

		return function (...args) {
			// Extract the callback function (last argument)
			const originalArgs = [...args];
			const callback = originalArgs.pop();

			// Verify callback is a function
			if (typeof callback !== 'function') {
				throw new Error('Last argument should be a callback function');
			}

			// Create a key from all arguments except the callback
			const key = JSON.stringify(originalArgs);

			// If we have a cached result, use it
			if (cache.has(key)) {
				const cachedValue = cache.get(key);

				// Use Promise.resolve().then() to ensure asynchronous behavior is preserved
				Promise.resolve().then(() => {
					if (cachedValue.error) {
						callback(cachedValue.error, null);
					} else {
						callback(null, cachedValue.result);
					}
				});

				return;
			}

			// Add our own callback that will cache the result
			originalArgs.push((error, result) => {
				if (error) {
					cache.set(key, { error, result: null });
				} else {
					cache.set(key, { error: null, result });
				}

				callback(error, result);
			});

			// Call the original function with the modified arguments
			asyncFn.apply(this, originalArgs);
		};
	};
})();
