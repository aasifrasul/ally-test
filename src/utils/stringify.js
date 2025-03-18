const typeCheck = (data) => Object.prototype.toString.call(data).slice(8, -1).toLowerCase();

const isFunction = (data) => typeCheck(data) === 'function';
const isArray = (data) => typeCheck(data) === 'array';
const isObject = (data) => typeCheck(data) === 'object';
const isNull = (data) => typeCheck(data) === 'null';
const isUndefined = (data) => typeCheck(data) === 'undefined';
const isNumber = (data) => typeCheck(data) === 'number';
const isString = (data) => typeCheck(data) === 'string';
const isBoolean = (data) => typeCheck(data) === 'boolean';
const isSymbol = (data) => typeCheck(data) === 'symbol';
const isDate = (data) => typeCheck(data) === 'date';
const isEmpty = (data) => isUndefined(data) || isNull(data) || data === '';

function stringify(obj, replacer, space, seen = new WeakSet()) {
	if (typeof obj === 'object' && obj !== null) {
		if (seen.has(obj)) {
			return '[Circular]';
		}
		seen.add(obj);
	}

	if (isString(obj)) {
		return '"' + obj + '"';
	} else if (isUndefined(obj)) {
		return String(null);
	} else if (isNull(obj) || isNumber(obj) || isBoolean(obj) || isFunction(obj)) {
		return String(obj);
	} else if (isDate(obj)) {
		return '"' + obj.toISOString() + '"';
	} else if (isArray(obj)) {
		const resultArray = obj.map((item) => stringify(item, replacer, space, seen));
		return '[' + resultArray.join(',') + ']';
	} else if (isObject(obj)) {
		const result = [];
		Reflect.ownKeys(obj).forEach((key) => {
			const stringifiedKey = isSymbol(key) ? key.toString() : key;
			if (replacer) {
				const replacement = replacer(key, obj[key]);
				if (!isEmpty(replacement)) {
					result.push(
						'"' +
							stringifiedKey +
							'":' +
							stringify(replacement, replacer, space, seen),
					);
				}
			} else {
				result.push(
					'"' + stringifiedKey + '":' + stringify(obj[key], replacer, space, seen),
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

const obj = {
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

stringify(obj);
