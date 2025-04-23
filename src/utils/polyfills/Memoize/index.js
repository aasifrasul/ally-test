/**
 * Polyfill Memoization
 * @param {*} fn - The function to memoize
 * @param {*} maxCacheSize - max no of Cache size
 * @returns {Function} - A memoized version of the function
 */
function memoize(fn) {
	// Main cache that maps functions to their argument caches
	memoize.__hash = memoize.__hash || new WeakMap();

	if (!memoize.__hash.has(fn)) {
		memoize.__hash.set(fn, new Map());
	}

	const funtionCache = memoize.__hash.get(fn);

	return function inner(...args) {
		const key = JSON.stringify(args);

		if (funtionCache.has(key)) {
			return funtionCache.get(key);
		}

		const result = fn.apply(this, args);
		funtionCache.set(key, result);
		return result;
	};
}

function keyGenerator(args) {
	return args
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
}

const memoize = (function () {
	const functionCaches = new WeakMap();

	return function outer(fn) {
		if (!functionCaches.has(fn)) {
			functionCaches.set(fn, Object.create(null));
		}

		const hash = functionCaches.get(fn);

		return function inner(...args) {
			const key = JSON.stringify(args);
			if (key in hash) return hash[key];
			const result = fn.apply(this, args);
			hash[key] = result;
			return result;
		};
	};
})();
