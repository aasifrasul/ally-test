export function deepCopy<T>(obj: T, seen = new WeakMap()): T {
	// Handle primitives, null, and functions
	if (obj === null || typeof obj !== 'object') return obj;

	// Check for circular references
	if (seen.has(obj)) return seen.get(obj);

	// Mark as being processed to prevent infinite recursion
	seen.set(obj, obj);

	let result: any;

	if (Array.isArray(obj)) {
		return obj.map((item) => deepCopy(item, seen)) as T;
	}

	if (obj instanceof Date) return new Date(obj) as T;
	if (obj instanceof RegExp) return new RegExp(obj) as T;

	if (obj instanceof Map) {
		result = new Map();
		for (const [key, value] of obj) {
			result.set(deepCopy(key, seen), deepCopy(value, seen));
		}
		return result as T;
	}

	if (obj instanceof Set) {
		result = new Set();
		for (const value of obj) {
			result.add(deepCopy(value, seen));
		}
		return result as T;
	}

	// Handle plain objects
	result = Object.create(Object.getPrototypeOf(obj));

	const props = [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)];

	for (const prop of props) {
		const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
		if (descriptor) {
			if (descriptor.get || descriptor.set) {
				Object.defineProperty(result, prop, descriptor);
			} else {
				Object.defineProperty(result, prop, {
					...descriptor,
					value: deepCopy(descriptor.value, seen),
				});
			}
		}
	}

	return result;
}
