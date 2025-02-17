/**
 * Polyfill Memoization
 * @param {*} fn - The function to memoize
 * @param {*} maxCacheSize - max no of Cache size
 * @returns {Function} - A memoized version of the function
 * */

function memoize(func, maxCacheSize = 100) {
	const cache = new Map();

	return function (...args) {
		const key = args
			.map((arg) => {
				let result = `${typeof arg}:`;
				if (typeof arg === 'object' && arg !== null) {
					try {
						result += JSON.stringify(arg);
					} catch (e) {
						result += arg.toString();
					}
				} else if (typeof arg === 'function') {
					result += arg.toString();
				} else {
					result += arg.toString();
				}
				return result;
			})
			.join('||');

		let result;
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
