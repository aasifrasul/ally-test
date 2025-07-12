function myReduce(callback, initialValue) {
	if (!Array.isArray(this)) {
		throw new TypeError('this is null or undefined');
	}

	if (typeof callback !== 'function') {
		throw new TypeError(callback + ' is not a function');
	}

	const list = Object(this);

	if (list.length === 0) {
		throw new TypeError('Reduce of empty array with no initial value');
	}

	let result = initialValue || list[0];
	const start = initialValue ? 0 : 1;

	for (let i = start; i < list.length; i++) {
		if (i in list) {
			try {
				result = callback(result, list[i], i, list);
			} catch (err) {
				throw err;
			}
		}
	}

	return result;
}

Array.prototype.myReduce = Array.prototype.myReduce || myReduce;
