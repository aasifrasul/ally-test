export function deepCopy<T>(obj: T, seen = new WeakMap()): T {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	// Handle circular references
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
		const copy = obj.map((item) => deepCopy(item, seen)) as any;
		seen.set(obj, copy);
		return copy;
	}

	if (obj instanceof Object) {
		const copy = Object.create(Object.getPrototypeOf(obj));
		seen.set(obj, copy);

		// Copy string-keyed properties
		for (const [key, value] of Object.entries(obj)) {
			copy[key] = deepCopy(value, seen);
		}

		// Copy symbol-keyed properties
		for (const sym of Object.getOwnPropertySymbols(obj)) {
			copy[sym] = deepCopy((obj as any)[sym], seen);
		}

		return copy as T;
	}

	return obj;
}
