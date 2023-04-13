function getRandomInt(min = 1000 * 1000, max = 2000 * 1000) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Creates a deep copy of a given object/array
 * Usual ways create a shallow copy
 * For truly deep copy each nested item has to be iterated over and a copy be created.
 * Special handling is needed for array/object/time as they are passed by reference
 */
function deepCopy(obj, map = new WeakMap()) {
	const type = Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();

	if (type === 'date') {
		return new Date(obj);
	}

	if (['object', 'array'].indexOf(type) < 0) {
		return obj;
	}

	if (map.has(obj)) {
		return map.get(obj);
	}

	let newObj = type === 'array' ? [] : {};

	map.set(obj, newObj);

	for (let prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			newObj[prop] = deepCopy(obj[prop], map);
		}
	}

	return newObj;
}

export { getRandomInt, deepCopy };
