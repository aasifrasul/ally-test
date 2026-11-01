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
	| 'weakmap'
	| 'weakset'
	| 'promise'
	| 'date'
	| 'symbol'
	| 'regexp'
	| 'function';

// Core type-fetching utility
export const getType = (data: unknown): TypeName =>
	Object.prototype.toString.call(data).slice(8, -1).toLowerCase() as TypeName;

export const typeCheck = <T>(data: unknown, type: TypeName): data is T =>
	getType(data) === type;

// Primitive & Basic Type Guards (Declared in dependency order)
export const isNull = (data: unknown): data is null => typeCheck(data, 'null');
export const isUndefined = (data: unknown): data is undefined => typeCheck(data, 'undefined');
export const isNumber = (data: unknown): data is number => typeCheck(data, 'number');
export const isString = (data: unknown): data is string => typeCheck(data, 'string');
export const isBoolean = (data: unknown): data is boolean => typeCheck(data, 'boolean');
export const isFunction = (data: unknown): data is Function => typeCheck(data, 'function');
export const isSymbol = (data: unknown): data is symbol => typeCheck(data, 'symbol');

// Complex Type Guards
export const isArray = (data: unknown): data is unknown[] => typeCheck(data, 'array');
export const isObject = (data: unknown): data is Record<string, unknown> =>
	typeCheck(data, 'object');

// Dependent Guards (must be declared AFTER isObject)
export const isExist = <T>(data: T | null | undefined): data is T =>
	data !== null && data !== undefined;

export const hasProperty = <T extends object, K extends PropertyKey>(
	data: T,
	property: K,
): data is T & Record<K, unknown> => isObject(data) && property in data;

// Instance-based Type Guards
export const isMap = (data: unknown): data is Map<unknown, unknown> => data instanceof Map;
export const isSet = (data: unknown): data is Set<unknown> => data instanceof Set;
export const isWeakMap = (data: unknown): data is WeakMap<object, unknown> =>
	data instanceof WeakMap;
export const isWeakSet = (data: unknown): data is WeakSet<object> => data instanceof WeakSet;
export const isPromise = (data: unknown): data is Promise<unknown> => data instanceof Promise;
export const isDate = (data: unknown): data is Date => data instanceof Date;
export const isRegExp = (data: unknown): data is RegExp => data instanceof RegExp;

// Utility checks
export const arraySize = (arr: unknown): number | null => (isArray(arr) ? arr.length : null);

export const isEmptyString = (str: unknown): str is string =>
	isString(str) && str.length === 0;

export const isEmptyArray = <T>(arr: unknown): arr is T[] => isArray(arr) && arr.length === 0;

export const isEmptyObject = (obj: unknown): obj is Record<string, unknown> =>
	isObject(obj) &&
	Object.getPrototypeOf(obj) === Object.prototype &&
	Object.keys(obj).length === 0;

export const isEmpty = (data: unknown): boolean =>
	data == null || isEmptyString(data) || isEmptyArray(data) || isEmptyObject(data);

export const isAsyncFunction = (data: unknown): data is (...args: any[]) => Promise<unknown> =>
	isFunction(data) && Object.prototype.toString.call(data) === '[object AsyncFunction]';

export const isGeneratorFunction = (data: unknown): data is GeneratorFunction => {
	if (!isFunction(data)) return false;
	if (Object.prototype.toString.call(data) === '[object GeneratorFunction]') return true;

	const proto = Object.getPrototypeOf(data);
	return proto?.constructor?.name === 'GeneratorFunction';
};

// Result pattern implementation
type Result<T> = { ok: true; value: T } | { ok: false; error: unknown };

export const safelyExecuteFunction = <T>(
	func: (...args: any[]) => T,
	context: object | null = null,
	...params: any[]
): Result<T> => {
	try {
		const value = context ? func.apply(context, params) : func(...params);
		return { ok: true, value };
	} catch (error) {
		return { ok: false, error };
	}
};

export const safeAsyncExecute = async <T>(
	fn: (...args: any[]) => T | Promise<T>,
	...args: any[]
): Promise<T> => {
	if (!isFunction(fn)) {
		throw new TypeError('Please pass a valid function!');
	}
	return await fn(...args);
};
