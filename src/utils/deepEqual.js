import { isObject } from './typeChecking';

export function deepEqual(objectA, objectB) {
	const areObjects = isObject(objectA) && isObject(objectB);

	if (!areObjects) {
		return objectA === objectB;
	}

	const keysA = Object.keys(objectA);
	const keysB = Object.keys(objectB);

	if (keysA.length !== keysB.length) {
		return false;
	}

	for (let key of keysA) {
		return deepEqual(objectA[key], objectB[key]);
	}

	return true;
}
