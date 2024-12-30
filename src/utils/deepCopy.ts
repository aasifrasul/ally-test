export function deepCopy<T>(obj: T, seen = new WeakMap()): T {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	if (seen.has(obj)) {
		return seen.get(obj);
	}

	if (obj instanceof Date) {
		return new Date(obj.getTime()) as any;
	}

	if (obj instanceof RegExp) {
		return new RegExp(obj) as any;
	}

	if (Array.isArray(obj)) {
		const arrCopy = [] as any[];

		seen.set(obj, arrCopy);

		for (const item of obj) {
			arrCopy.push(deepCopy(item, seen));
		}

		return arrCopy as any;
	}

	if (obj instanceof Map) {
		const mapCopy = new Map();

		seen.set(obj, mapCopy);

		for (const [key, value] of obj) {
			mapCopy.set(key, deepCopy(value, seen));
		}

		return mapCopy as any;
	}

	if (obj instanceof Set) {
		const setCopy = new Set();

		seen.set(obj, setCopy);

		for (const value of obj) {
			setCopy.add(deepCopy(value, seen));
		}

		return setCopy as any;
	}

	const objCopy = {} as any;

	seen.set(obj, objCopy);

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			objCopy[key] = deepCopy((obj as any)[key], seen);
		}
	}

	Object.getOwnPropertyNames(obj).forEach((prop) => {
		const descriptor = Object.getOwnPropertyDescriptor(obj, prop);

		if (descriptor) {
			Object.defineProperty(objCopy, prop, descriptor);
		}
	});

	return objCopy;
}
