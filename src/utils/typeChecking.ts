export const typeCheck = (data, type) =>
	Object.prototype.toString.call(data).slice(8, -1).toLowerCase() === type;

export const isArray = (data) => typeCheck(data, 'array');
export const isObject = (data) => typeCheck(data, 'object');
export const isNull = (data) => typeCheck(data, 'null');
export const isUndefined = (data) => typeCheck(data, 'undefined');
export const isNumber = (data) => typeCheck(data, 'number');
export const isString = (data) => typeCheck(data, 'string');
export const isBoolean = (data) => typeCheck(data, 'boolean');
export const isMap = (data) => typeCheck(data, 'map');
export const isSet = (data) => typeCheck(data, 'set');
export const isPromise = (data) => typeCheck(data, 'promise');
export const isDate = (data) => typeCheck(data, 'date');
export const isSymbol = (data) => typeCheck(data, 'symbol');
export const isRegExp = (data) => typeCheck(data, 'regexp');

export const arraySize = (arr) => (isArray(arr) ? arr.length : null);

export const isEmptyString = (str) => isString(str) && str.length === 0;
export const isEmptyArray = (arr) => arraySize(arr) === 0;
export const isEmptyObject = (obj) => isObject(obj) && Object.keys(obj).length === 0;

export const isEmpty = (data) =>
	isUndefined(data) ||
	isNull(data) ||
	isEmptyString(data) ||
	isEmptyArray(data) ||
	isEmptyObject(data);

export const isFunction = (data) => typeCheck(data, 'function');

export const isAsyncfunction = (data: any): data is (...args: any[]) => Promise<any> => {
	if (!isFunction(data)) return false;

	// Check if it's an async function using constructor name
	if (data.constructor.name === 'AsyncFunction') return true;

	// Check if it's an async function by examining its string representation
	if (data.toString().includes('async')) return true;

	// Check if it returns a Promise
	try {
		const result = data();
		return result instanceof Promise;
	} catch {
		return false;
	}
};

export const isGeneratorFunction = (data: any): data is GeneratorFunction => {
	if (!isFunction(data)) return false;

	// Check if it's a generator function using constructor name
	if (data.constructor.name === 'GeneratorFunction') return true;

	// Check if it's a generator function by examining its string representation
	if (data.toString().includes('function*')) return true;

	// Check if it has the 'next', 'throw', and 'return' methods when called
	try {
		const result = data();
		return (
			isFunction(result.next) && isFunction(result.throw) && isFunction(result.return)
		);
	} catch {
		return false;
	}
};

export const safelyExecuteFunction = (
	func: (...args: any[]) => any,
	context?: object,
	...params: any[]
): any => {
	if (!isFunction(func)) {
		console.log('Please pass a valid function!');
		return;
	}

	return isObject(context) ? func.apply(context, params) : func(...params);
};

export async function safeExecute<T>(
	fn: (...args: any[]) => T | Promise<T>,
	...args: any[]
): Promise<T | null> {
	if (!isFunction(fn)) {
		console.warn('Please pass a valid function!');
		return null;
	}

	try {
		const result = fn(...args);
		return isPromise(result) ? await result : result;
	} catch (error) {
		console.error('An error occurred:', error);
		throw error;
	}
}
