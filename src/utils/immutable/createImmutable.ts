import {
	isArray,
	isObject,
	isRegExp,
	isDate,
	isMap,
	isSet,
	isWeakMap,
	isWeakSet,
	isPromise,
	isFunction,
	isString,
} from '../typeChecking';

const proxyCache = new WeakMap<object, object>();
const originalCache = new WeakMap<object, object>();

const mutatingArrayMethods: ReadonlySet<string> = new Set([
	'push',
	'pop',
	'shift',
	'unshift',
	'splice',
	'sort',
	'reverse',
	'fill',
	'copyWithin',
]);

function isBuiltIn(value: any): boolean {
	return (
		isRegExp(value) ||
		isDate(value) ||
		isMap(value) ||
		isSet(value) ||
		isWeakMap(value) ||
		isWeakSet(value) ||
		isPromise(value) ||
		value instanceof Error ||
		value instanceof ArrayBuffer ||
		value instanceof DataView ||
		ArrayBuffer.isView(value)
	);
}

function shouldProxy(value: any): value is object {
	return (
		isObject(value) && !Object.isFrozen(value) && !isFunction(value) && !isBuiltIn(value)
	);
}

export type DeepReadonly<T> = T extends (...args: any[]) => any
	? T
	: T extends readonly (infer R)[]
		? ReadonlyArray<DeepReadonly<R>>
		: T extends object
			? { readonly [K in keyof T]: DeepReadonly<T[K]> }
			: T;

export function createImmutable<T extends object>(obj: T): DeepReadonly<T> {
	// Already proxied
	if (proxyCache.has(obj)) {
		return proxyCache.get(obj) as DeepReadonly<T>;
	}

	// Is already one of our proxies
	if (originalCache.has(obj)) {
		return obj as DeepReadonly<T>;
	}

	const proxy = new Proxy(obj, {
		set(_target, prop) {
			throw new Error(`Cannot set property ${String(prop)} on immutable object`);
		},

		deleteProperty(_target, prop) {
			throw new Error(`Cannot delete property ${String(prop)} from immutable object`);
		},

		defineProperty(_target, prop) {
			throw new Error(`Cannot define property ${String(prop)} on immutable object`);
		},

		setPrototypeOf() {
			throw new Error('Cannot set prototype on immutable object');
		},

		get(target, prop, receiver) {
			const value = Reflect.get(target, prop, receiver);

			// Array handling
			if (isArray(target) && isString(prop) && isFunction(value)) {
				if (mutatingArrayMethods.has(prop)) {
					return () => {
						throw new Error(
							`Cannot call mutating method ${prop} on immutable array`,
						);
					};
				}

				// Non-mutating array methods
				return function (...args: any[]) {
					const result = value.apply(target, args);
					return shouldProxy(result) ? createImmutable(result) : result;
				};
			}

			// Recursively proxy objects
			if (shouldProxy(value)) {
				return createImmutable(value);
			}

			// Built-ins are returned as-is (identity preserved)
			return value;
		},
	});

	proxyCache.set(obj, proxy);
	originalCache.set(proxy, obj);

	return proxy as DeepReadonly<T>;
}

export function isImmutable(value: any): boolean {
	return originalCache.has(value);
}

export function getOriginal<T extends object>(immutable: T): T | undefined {
	return originalCache.get(immutable) as T | undefined;
}
