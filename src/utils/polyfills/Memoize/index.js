/**
 * Polyfill Memoization
 * @param {*} fn - The function to memoize
 * @returns {Function} - A memoized version of the function
 * */

function memoize(fn) {
	// This can be a map.
	const hash = {};

	if (typeof fn !== 'function') {
		throw new TypeError('Parameter should be a function');
	}

	return function (...params) {
		// At least for primitive types it will sort correctly and improve performance
		const key = JSON.stringify(params.sort());

		if (key in hash) {
			console.log(` Found in hash, ${key}, ${JSON.stringify(hash)}, ${params}`);
			return hash[key];
		}

		const result = fn.apply(this, ...params);

		hash[key] = result;

		return result;
	};
}
