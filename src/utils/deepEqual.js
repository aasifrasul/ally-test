import { isObject, isArray } from './typeChecking';

export function deepEqual(data1, data2) {
	if (!(isObject(data1) && isObject(data2)) || !(isArray(data1) && isArray(data2))) {
		return data1 === data2;
	}

	const keysA = Object.keys(data1);
	const keysB = Object.keys(data2);

	if (keysA.length !== keysB.length) {
		return false;
	}

	for (let key of keysA) {
		return deepEqual(data1[key], data2[key]);
	}

	return true;
}
