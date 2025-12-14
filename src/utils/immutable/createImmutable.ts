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

const mutatingArrayMethods: string[] = [
	'push',
	'pop',
	'shift',
	'unshift',
	'splice',
	'sort',
	'reverse',
];
const nonMutatingArrayMethods: string[] = ['map', 'filter', 'slice', 'concat'];

// Helper function to check if an object should be proxied
function shouldProxy(value: any): boolean {
	if (!isObject(value) || Object.isFrozen(value)) {
		return false;
	}

	// Don't proxy built-in objects that have special internal behavior
	return !(
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
		// Add other built-ins as needed
		isFunction(value)
	);
}

export function createImmutable<T extends object>(obj: T): T {
	if (proxyCache.has(obj)) {
		return proxyCache.get(obj) as T;
	}

	const proxy = new Proxy(obj, {
		set: (target: T, prop: PropertyKey, value: any) => {
			throw new Error(`This object is immutable, cannot set property: ${String(prop)}`);
		},
		deleteProperty: (target: T, prop: PropertyKey) => {
			throw new Error(
				`This object is immutable, cannot delete property: ${String(prop)}`,
			);
		},
		defineProperty: (target: T, prop: PropertyKey, descriptor: PropertyDescriptor) => {
			throw new Error(
				`This object is immutable, cannot define new property: ${String(prop)}`,
			);
		},
		get(target: T, prop: PropertyKey, receiver: any) {
			// Handle array methods first (before getting the value)
			if (isArray(target) && isString(prop)) {
				if (mutatingArrayMethods.includes(prop)) {
					throw new Error(`Cannot use mutating method ${prop} on immutable array`);
				}
				if (nonMutatingArrayMethods.includes(prop)) {
					const originalMethod = (target as any)[prop];
					return (...args: any[]) =>
						createImmutable(originalMethod.apply(target, args));
				}
			}

			const value = Reflect.get(target, prop, receiver);

			// Only proxy plain objects and arrays, not built-in objects
			if (shouldProxy(value)) {
				return createImmutable(value as T);
			}

			return value;
		},
	});

	proxyCache.set(obj, proxy);
	return proxy;
}
