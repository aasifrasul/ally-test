function myFilter(callback, thisArg) {
	if (!Array.isArray(this)) {
		throw new TypeError('this is null or undefined');
	}

	if (typeof callback !== 'function') {
		throw new TypeError(callback + ' is not a function');
	}

	const list = Object(this);
	const result = [];

	for (let i = 0; i < list.length; i++) {
		if (i in list) {
			// Skip holes in sparse arrays
			try {
				const response = callback.call(thisArg, list[i], i, list);
				if (response) {
					result.push(list[i]);
				}
			} catch (err) {
				throw err;
			}
		}
	}

	return result;
}

Array.prototype.myFilter = Array.prototype.myFilter || myFilter;
