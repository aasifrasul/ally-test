export function deepCopy<T>(obj: T, seen = new WeakMap()): T {
	// Handle primitives, null, and functions
	if (obj === null || typeof obj !== 'object') return obj;

	// Check for circular references
	if (seen.has(obj)) return seen.get(obj);
	seen.set(obj, true);

	// Add to seen map early to handle all object types
	let result: any;

	if (Array.isArray(obj)) {
		result = [];

		obj.forEach((item, index) => {
			result[index] = deepCopy(item, seen);
		});
	} else if (obj instanceof Date) {
		result = new Date(obj);
	} else if (obj instanceof RegExp) {
		result = new RegExp(obj);
	} else if (obj instanceof Map) {
		result = new Map();
		for (const [key, value] of obj) {
			result.set(deepCopy(key, seen), deepCopy(value, seen));
		}
	} else if (obj instanceof Set) {
		result = new Set();
		for (const value of obj) {
			result.add(deepCopy(value, seen));
		}
	} else {
		// Handle plain objects
		result = Object.create(Object.getPrototypeOf(obj));

		const props = [
			...Object.getOwnPropertyNames(obj),
			...Object.getOwnPropertySymbols(obj),
		];
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
	}

	return result;
}
