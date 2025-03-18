export function deepCopy<T>(obj: T, seen = new WeakMap()): T {
	if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
		return obj;
	}

	if (seen.has(obj)) {
		return seen.get(obj);
	}

	if (typeof obj === 'function') {
		return new Function('return ' + (obj as Function).toString())();
	}

	if (Array.isArray(obj)) {
		const arrCopy = obj.map((item) => deepCopy(item, seen));
		seen.set(obj, arrCopy);
		return arrCopy as any;
	}

	if (obj instanceof Date) return new Date(obj) as unknown as T;
	if (obj instanceof RegExp) return new RegExp(obj) as unknown as T;

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

	const proto = Object.getPrototypeOf(obj);
	const objCopy = Object.create(proto);
	seen.set(obj, objCopy);

	// Get all properties, including symbols
	const props = [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)];

	for (const prop of props) {
		const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
		if (descriptor) {
			if (descriptor.get || descriptor.set) {
				// Preserve getters/setters
				Object.defineProperty(objCopy, prop, descriptor);
			} else {
				// Deep copy value properties
				Object.defineProperty(objCopy, prop, {
					...descriptor,
					value: deepCopy(descriptor.value, seen),
				});
			}
		}
	}

	return objCopy;
}
