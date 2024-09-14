export function checkObjectEquality(data1: any, data2: any): boolean {
	// Check if the types are the same
	if (typeof data1 !== typeof data2) {
		return false;
	}

	// Handle primitive types and function equality
	if (typeof data1 !== 'object' || data1 === null || data2 === null) {
		if (typeof data1 === 'function') {
			return data1.toString() === data2.toString();
		}
		return data1 === data2;
	}

	// Handle arrays
	if (Array.isArray(data1) && Array.isArray(data2)) {
		if (data1.length !== data2.length) {
			return false;
		}
		for (let i = 0; i < data1.length; i++) {
			if (!checkObjectEquality(data1[i], data2[i])) {
				return false;
			}
		}
		return true;
	}

	// Handle objects
	const keys1 = Object.keys(data1);
	const keys2 = Object.keys(data2);

	if (keys1.length !== keys2.length) {
		return false;
	}

	for (let key of keys1) {
		if (
			!Object.prototype.hasOwnProperty.call(data2, key) ||
			!checkObjectEquality(data1[key], data2[key])
		) {
			return false;
		}
	}

	return true;
}
