import { createKey } from './keyGeneration';

/**
 * Polyfill Memoization
 * @param {*} fn - The function to memoize
 * @param {*} maxCacheSize - max no of Cache size
 * @returns {Function} - A memoized version of the function
 */
function memoize(fn) {
	// Main cache that maps functions to their argument caches
	memoize.__cache__data__ = memoize.__cache__data__ || new WeakMap();
	const allCaches = memoize.__cache__data__;

	if (!allCaches.has(fn)) {
		allCaches.set(fn, new Map());
	}

	const funtionCache = allCaches.get(fn);

	return function inner(...args) {
		//const key = JSON.stringify(args);
		const key = createKey(args);

		if (funtionCache.has(key)) {
			return funtionCache.get(key);
		}

		const result = fn.apply(this, args);
		funtionCache.set(key, result);
		return result;
	};
}

const memoize = (function () {
	const allCaches = new WeakMap();

	return function outer(fn) {
		if (!allCaches.has(fn)) {
			allCaches.set(fn, new Map());
		}

		const functionCache = allCaches.get(fn);

		return function inner(...args) {
			//const key = JSON.stringify(args);
			const key = createKey(args);

			if (!functionCache.has(key)) {
				const result = fn.apply(this, args);
				functionCache.set(key, result);
			}

			return functionCache.get(key);
		};
	};
})();
