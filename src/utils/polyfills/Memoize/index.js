/**
 * Polyfill Memoization
 * @param {*} fn - The function to memoize
 * @param {*} maxCacheSize - max no of Cache size
 * @returns {Function} - A memoized version of the function
 */
function memoize(func, maxCacheSize = 100) {
	const cache = new Map();
	return function (...args) {
		const key = keyGenerator(func, args);

		if (cache.has(key)) {
			// For LRU: delete and re-add to make this the most recently used
			const result = cache.get(key);
			cache.delete(key);
			cache.set(key, result);
			return result;
		}

		const result = func.apply(this, args);
		cache.set(key, result);

		// If cache exceeds max size, remove least recently used item
		if (cache.size > maxCacheSize) {
			// First key in Map is the oldest one
			const oldestKey = cache.keys().next().value;
			cache.delete(oldestKey);
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
