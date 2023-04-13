function getRandomInt(min = 1000 * 1000, max = 2000 * 1000) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

function deepClone(obj, map = new WeakMap()) {
	const type = Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();

	if (type !== 'object') {
		return obj;
	}

	if (type === 'date') {
		return new Date(obj);
	}

	if (map.has(obj)) {
		return map.get(obj);
	}

	map.set(obj, newObj);

	let newObj = type === 'array' ? [] : {};

	for (let prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			newObj[prop] = deepClone(obj[prop], map);
		}
	}

	return newObj;
}

export { getRandomInt, deepClone };
