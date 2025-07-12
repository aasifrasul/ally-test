function myMap(callback, thisArg) {
	if (!Array.isArray(this)) {
		throw new TypeError('this is null or undefined');
	}

	if (typeof callback !== 'function') {
		throw new TypeError(callback + ' is not a function');
	}

	const list = Object(this);
	const len = list.length;
	const result = new Array(len);

	for (let i = 0; i < len; i++) {
		// Only call callback for indices that exist on the array
		// filter out sparse
		if (i in list) {
			// Note: If callback is an arrow function, thisArg will be ignored
			try {
				result[i] = callback.call(thisArg, list[i], i, list);
			} catch (err) {
				throw err;
			}
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
