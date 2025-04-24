// Type definitions for better type safety
type TypeName =
	| 'array'
	| 'object'
	| 'null'
	| 'undefined'
	| 'number'
	| 'string'
	| 'boolean'
	| 'map'
	| 'set'
	| 'promise'
	| 'date'
	| 'symbol'
	| 'regexp'
	| 'function';

// More precise type guards
export const getType = <T>(data: unknown): string =>
	Object.prototype.toString.call(data).slice(8, -1);
export const typeCheck = <T>(data: unknown, type: TypeName): data is T =>
	getType(data).toLowerCase() === type;

// Type guard functions with proper return types
export const isArray = (data: unknown): data is unknown[] => Array.isArray(data);
export const isObject = (data: unknown): data is object =>
	data !== null && typeof data === 'object' && !Array.isArray(data);
export const isNull = (data: unknown): data is null => data === null;
export const isUndefined = (data: unknown): data is undefined => data === undefined;
export const isNumber = (data: unknown): data is number =>
	typeof data === 'number' && !isNaN(data);
export const isString = (data: unknown): data is string => typeof data === 'string';
export const isBoolean = (data: unknown): data is boolean => typeof data === 'boolean';
export const isMap = (data: unknown): data is Map<unknown, unknown> => data instanceof Map;
export const isSet = (data: unknown): data is Set<unknown> => data instanceof Set;
export const isPromise = (data: unknown): data is Promise<unknown> => data instanceof Promise;
export const isDate = (data: unknown): data is Date => data instanceof Date;
export const isSymbol = (data: unknown): data is symbol => typeof data === 'symbol';
export const isRegExp = (data: unknown): data is RegExp => data instanceof RegExp;
export const isFunction = (data: unknown): data is Function => typeof data === 'function';

// Improved array size function with type safety
export const arraySize = <T>(arr: T[] | unknown): number | null =>
	isArray(arr) ? (arr?.length ?? null) : null;

// Empty checks with proper type guards
export const isEmptyString = (str: unknown): str is string =>
	isString(str) && str.length === 0;

export const isEmptyArray = <T>(arr: T[] | unknown): arr is T[] => arraySize(arr) === 0;

export const isEmptyObject = (obj: unknown): obj is object =>
	isObject(obj) && Object.keys(obj).length === 0;

export const isEmpty = (data: unknown): boolean =>
	data == null || // Covers both null and undefined
	isEmptyString(data) ||
	isEmptyArray(data) ||
	isEmptyObject(data);

// Improved async function check
export const isAsyncFunction = (data: unknown): data is Function => {
	if (!isFunction(data)) return false;

	return (
		data.constructor.name === 'AsyncFunction' ||
		data.toString().includes('async') ||
		(() => {
			try {
				const result = data();
				return isPromise(result);
			} catch {
				return false;
			}
		})()
	);
};

// Improved generator function check
export const isGeneratorFunction = (data: unknown): data is GeneratorFunction => {
	if (!isFunction(data)) return false;

	return (
		data.constructor.name === 'GeneratorFunction' ||
		data.toString().includes('function*') ||
		(() => {
			try {
				const result = data();
				return (
					isObject(result) &&
					result !== null &&
					typeof result === 'object' &&
					isFunction((result as Iterator<unknown>).next) &&
					isFunction((result as Iterator<unknown>).throw) &&
					isFunction((result as Iterator<unknown>).return)
				);
			} catch {
				return false;
			}
		})()
	);
};

// Improved function execution utilities with better type safety
export const safelyExecuteFunction = <T>(
	func: (...args: any[]) => T,
	context: object | null,
	...params: any[]
): T | undefined => {
	if (!isFunction(func)) {
		console.warn('Please pass a valid function!');
		return undefined;
	}

	return isObject(context) ? func.apply(context, params) : func(...params);
};

export const safeExecute = async <T>(
	fn: (...args: any[]) => T | Promise<T>,
	...args: any[]
): Promise<T | null> => {
	if (!isFunction(fn)) {
		console.warn('Please pass a valid function!');
		return null;
	}

	try {
		const result = await fn(...args);
		return result;
	} catch (error) {
		console.error('An error occurred:', error);
		throw error;
	}
};
