/**
 * Creates a robust serialization key for memoization
 * @param {*} value - The value to serialize
 * @param {Set} [seen=new Set()] - Set of already seen objects to handle circular references
 * @returns {string} A string key representation
 */
export function createKey(value, seen = new Set()) {
	// Handle primitive types
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value !== 'object' && typeof value !== 'function') {
		return `${typeof value}:${value}`;
	}

	// Handle functions - use their string representation
	if (typeof value === 'function') {
		return `function:${value.toString()}`;
	}

	// Handle circular references
	if (seen.has(value)) {
		return 'circular';
	}
	seen.add(value);

	// Handle arrays - sort them for consistency
	if (Array.isArray(value)) {
		return `array:[${value
			.map((item) => createKey(item, seen))
			.sort()
			.join(',')}]`;
	}

	// Handle objects - sort keys for consistent order
	const sortedKeys = Object.keys(value).sort();
	//const objType = Object.getPrototypeOf(value).constructor.name;
	const objType = Object.prototype.toString.call(value).slice(8, -1);

	const properties = sortedKeys
		.map((key) => {
			const propValue = createKey(value[key], seen);
			return `${key}:${propValue}`;
		})
		.join(',');

	return `${objType}:{${properties}}`;
}
