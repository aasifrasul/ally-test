function myMap(callback, thisArg) {
	if (!Array.isArray(this)) {
		throw new TypeError('this is null or undefined');
	}

	if (typeof callback !== 'function') {
		throw new TypeError(callback + ' is not a function');
	}

	const len = this.length;
	const result = new Array(len);

	for (let i = 0; i < len; i++) {
		// Only call callback for indices that exist on the array
		if (i in this) {
			// Note: If callback is an arrow function, thisArg will be ignored
			result[i] = callback.call(thisArg, this[i], i, this);
		}
	}

	return result;
}

Object.defineProperty(Array.prototype, 'myMap', {
	value: myMap,
	enumerable: false,
	configurable: true,
	writable: true,
});
