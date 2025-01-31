function myReduce(fn, initialValue) {
	if (!Array.isArray(this)) {
		throw new TypeError('myReduce called on non-array');
	}

	if (typeof fn !== 'function') {
		throw new TypeError(fn + ' is not a function');
	}

	const len = this.length;

	// Handle empty array cases
	if (len === 0 && arguments.length < 2) {
		throw new TypeError('Reduce of empty array with no initial value');
	}

	let accumulator;
	let startIndex;

	if (arguments.length >= 2) {
		accumulator = initialValue;
		startIndex = 0;
	} else {
		accumulator = this[0];
		startIndex = 1;
	}

	for (let i = startIndex; i < len; i++) {
		if (i in this) {
			// Skip holes in sparse arrays
			accumulator = fn.call(undefined, accumulator, this[i], i, this);
		}
	}

	return accumulator;
}

if (!Array.prototype.myReduce) {
	Object.defineProperty(Array.prototype, 'myReduce', {
		value: myReduce,
		enumerable: false,
		configurable: true,
		writable: true,
	});
}
