function myMap(callback, thisArg) {
	if (!Array.isArray(this)) {
		throw new TypeError('this is null or undefined');
	}

	if (typeof callback !== 'function') {
		throw new TypeError(callback + ' is not a function');
	}

	const originalArray = Object(this);
	const len = originalArray.length;
	const result = new Array(len);

	for (let i = 0; i < len; i++) {
		// Only call callback for indices that exist on the array
		if (i in originalArray) {
			// Note: If callback is an arrow function, thisArg will be ignored
			result[i] = callback.call(thisArg, originalArray[i], i, originalArray);
		}
	}

	return result;
}

if (!Array.prototype.myMap) {
	Object.defineProperty(Array.prototype, 'myMap', {
		value: myMap,
		enumerable: false,
		configurable: true,
		writable: true,
	});
}
