/**
 * Polyfill Memoization
 * @param {*} fn - The function to memoize
 * @param {*} maxCacheSize - max no of Cache size
 * @returns {Function} - A memoized version of the function
 * */
function memoize(func, maxCacheSize = 100) {
	const cache = new Map();

	return function (...args) {
		let result;
		const key = keyGenerator(func, args);

		if (cache.has(key)) {
			result = cache.get(key);
			cache.delete(key); // Move to end of LRU order
		} else {
			result = func.apply(this, args);
		}

		cache.set(key, result);

		if (cache.size > maxCacheSize) {
			cache.delete(cache.keys().next().value);
		}

		return result;
	};
}

function keyGenerator(fn, args) {
	const fnId = fn.name || fn.toString().slice(0, 20);
	const key = args
		.map((arg) => {
			const argType = `${typeof arg}:`;

			// Only use JSON.stringify for pure objects (not arrays, null, etc.)
			if (
				typeof arg === 'object' &&
				arg !== null &&
				Object.getPrototypeOf(arg) === Object.prototype
			) {
				try {
					return argType + JSON.stringify(arg);
				} catch (e) {
					return argType + arg.toString();
				}
			} else {
				// For all other types, including arrays and functions
				return argType + arg.toString();
			}
		})
		.join('||');

	return `${fnId}__${key}`;
}
