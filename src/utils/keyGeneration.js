/**
 * Creates a robust serialization key for memoization
 * @param {*} value - The value to serialize
 * @param {Set} [seen=new Set()] - Set of already seen objects to handle circular references
 * @returns {string} A string key representation
 */
export function createKey(value, seen = new WeakSet()) {
	// Handle primitive types
	if (value === null) return 'null';
	// if (value === undefined) return 'undefined';
	if (typeof value === 'string') return `${typeof value}:"${value}"`;
	if (typeof value !== 'object') return `${typeof value}:${String(value)}`;

	// Handle circular references
	if (seen.has(value)) return 'circular';
	seen.set(value, true);

	// Handle arrays - sort for commutative operations like sum(1,2) === sum(2,1)
	if (Array.isArray(value)) {
		return `Array:[${value
			.map((item) => createKey(item, seen))
			.sort()
			.join(',')}]`;
	}

	// Handle Date objects
	if (value instanceof Date) {
		return `Date:${value.toISOString()}`;
	}

	// Handle RegExp objects
	if (value instanceof RegExp) {
		return `RegExp:${value.toString()}`;
	}

	// Handle Set objects - sort for consistency
	if (value instanceof Set) {
		return `Set:[${Array.from(value)
			.map((item) => createKey(item, seen))
			.sort()
			.join(',')}]`;
	}

	// Handle Map objects - sort entries by key representation
	if (value instanceof Map) {
		return `Map:{${Array.from(value.entries())
			.map(([k, v]) => `${createKey(k, seen)}:${createKey(v, seen)}`)
			.sort()
			.join(',')}}`;
	}

	// Handle objects - sort keys for consistent order
	const sortedKeys = Object.keys(value).sort();
	const objType = Object.prototype.toString.call(value).slice(8, -1);

	return `${objType}:{${sortedKeys
		.map((key) => `${key}:${createKey(value[key], seen)})}`)
		.join(',')}}`;
}

const value = {
	a: 1,
	b: 'string',
	c: [true, { m: 1 }, { n: [1, , null, 4] }, { 0: 7 }],
	d: {
		x: 1,
		y: [5, 6, 7, 8, () => alert('Hi')],
		z: {
			a1: 1,
			a2: [9, 8, 5],
			a3: {
				time: new Date(),
			},
			[Symbol.toPrimitive]: (hint) => alert('Hi'),
		},
	},
	e: undefined,
	f: null,
	g: true,
};

createKey(value);
