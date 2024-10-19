export const typeCheck = <T>(data: unknown, type: string): boolean =>
	Object.prototype.toString.call(data).slice(8, -1).toLowerCase() === type;

export const isArray = (data: unknown) => typeCheck(data, 'array');
export const isObject = (data: unknown) => typeCheck(data, 'object');
export const isNull = (data: unknown) => typeCheck(data, 'null');
export const isUndefined = (data: unknown) => typeCheck(data, 'undefined');
export const isNumber = (data: unknown) => typeCheck(data, 'number');
export const isString = (data: unknown) => typeCheck(data, 'string');
export const isBoolean = (data: unknown) => typeCheck(data, 'boolean');
export const isMap = (data: unknown) => typeCheck(data, 'map');
export const isSet = (data: unknown) => typeCheck(data, 'set');
export const isPromise = (data: unknown) => typeCheck(data, 'promise');
export const isDate = (data: unknown) => typeCheck(data, 'date');
export const isSymbol = (data: unknown) => typeCheck(data, 'symbol');
export const isRegExp = (data: unknown) => typeCheck(data, 'regexp');

export const arraySize = <T>(arr: T[]): number | null => (isArray(arr) ? arr.length : null);

export const isEmptyString = (str: unknown) => isString(str) && (str as string).length === 0;
export const isEmptyArray = (arr: unknown[]) => arraySize(arr) === 0;
export const isEmptyObject = (obj: unknown) =>
	isObject(obj) && Object.keys(obj as object).length === 0;

export const isEmpty = (data: unknown) =>
	isUndefined(data) ||
	isNull(data) ||
	isEmptyString(data) ||
	isEmptyArray(data as unknown[]) ||
	isEmptyObject(data);

export const isFunction = (data: unknown) => typeCheck(data, 'function');

export const isAsyncfunction = (data: any): data is (...args: any[]) => Promise<any> => {
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
