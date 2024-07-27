export function checkObjectEquality(obj1, obj2) {
	if (typeof obj1 !== typeof obj2) {
		return false;
	}

	if (obj1 === obj2) {
		return true;
	}

	if (typeof obj1 === 'function') {
		return obj1.toString() === obj2.toString();
	}

	if (typeof obj1 !== 'object') {
		return false;
	}

	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	if (keys1.length !== keys2.length) {
		return false;
	}

	for (let i = 0; i < keys1.length; i++) {
		if (!checkObjectEquality(keys1[i], keys2[i])) {
			return false;
		}
		if (!checkObjectEquality(obj1[keys1[i]], obj2[keys1[i]])) {
			return false;
		}
	}

	return true;
}
