const getRandomInt = (min = 1000 * 1000, max = 2000 * 1000) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
};

/**
 * Creates a deep copy of a given object/array
 * Usual ways create a shallow copy
 * For truly deep copy each nested item has to be iterated over and a copy be created.
 * Special handling is needed for array/object/time as they are passed by reference
 */
const deepCopy = (obj, map = new WeakMap()) => {
	if (typeof obj === 'undefined' || typeof obj !== 'object' || map.has(obj)) {
		return obj;
	}

	map.set(obj, true);

	let newObj = obj instanceof Date ? new obj.constructor(obj) : obj.constructor();

	Reflect.ownKeys(obj).forEach((key) => (newObj[key] = deepCopy(obj[key], map)));

	return newObj;
};

module.exports = {
	getRandomInt,
	deepCopy,
};
