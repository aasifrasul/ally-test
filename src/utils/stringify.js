const typeCheck = (data) => Object.prototype.toString.call(data).slice(8, -1).toLowerCase();

const isSymbol = (data) => typeCheck(data) === 'symbol';

function stringify(value, replacer, space, seen = new WeakSet()) {
	if (value === null) return String(value);

	if (typeof value === 'string') return '"' + value + '"';

	if (typeof value !== 'object') return String(value);

	if (value instanceof Date) return '"' + value.toISOString() + '"';
	if (value instanceof RegExp) return '"' + value.toString() + '"';

	// Handle circular references
	if (seen.has(value)) return 'circular';

	seen.add(value);

	if (Array.isArray(value)) {
		const resultArray = value.map((item) => stringify(item, replacer, space, seen));
		return '[' + resultArray.join(',') + ']';
	}

	if (typeof value === 'object') {
		const result = [];
		Reflect.ownKeys(value).forEach((key) => {
			const stringifiedKey = isSymbol(key) ? key.toString() : stringify(key);
			if (replacer) {
				const replacement = replacer(key, value[key]);
				if (replacement) {
					result.push(
						`${stringifiedKey}:${stringify(replacement, replacer, space, seen)}`,
					);
				}
			} else {
				result.push(
					`${stringifiedKey}:${stringify(value[key], replacer, space, seen)}`,
				);
			}
		});
		if (space) {
			return '{\n' + result.join(',\n') + '\n' + Array(space + 1).join(' ') + '}';
		} else {
			return '{' + result.join(',') + '}';
		}
	}
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

stringify(value);
