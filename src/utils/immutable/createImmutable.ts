import { isArray, isObject } from '../typeChecking';

const proxyCache = new WeakMap<object, object>();

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
				`This object is immutable, cannot delete property: ${JSON.stringify(prop)}`,
			);
		},
		defineProperty: (target: T, prop: PropertyKey, descriptor: PropertyDescriptor) => {
			throw new Error(
				`This object is immutable, cannot define new property: ${JSON.stringify(prop)}`,
			);
		},
		get(target: T, prop: PropertyKey, receiver: any) {
			const descriptor = Object.getOwnPropertyDescriptor(target, prop);
			// Handle getters - call them with the original target, not the proxy
			if (descriptor && descriptor.get) {
				const value = descriptor.get.call(target);
				if (isObject(value) && !Object.isFrozen(value)) {
					return createImmutable(value);
				}
				return value;
			}

			const value = Reflect.get(target, prop, receiver);

			if (isArray(target)) {
				// Handle array methods
				if (
					['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(
						String(prop),
					)
				) {
					throw new Error(
						`Cannot use mutating method ${String(prop)} on immutable array`,
					);
				}
				if (['map', 'filter', 'slice', 'concat'].includes(String(prop))) {
					return (...args: any[]) => createImmutable((target as any)[prop](...args));
				}
			}

			if (isObject(value)) {
				return createImmutable(value);
			}
			return value;
		},
	});

	proxyCache.set(obj, proxy);
	return proxy;
}
