import { isArray, isObject } from './typeChecking';

export function createImmutable<T extends object>(obj: T): T {
	return new Proxy(obj, {
		set: (target: T, prop: PropertyKey, value: any) => {
			if (typeof prop === 'symbol') {
				throw new Error(
					`This object is immutable, cannot set property: ${String(prop)}`,
				);
			}
			throw new Error(
				`This object is immutable, cannot set property: ${JSON.stringify(prop)}`,
			);
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
				const value = descriptor.get.call(target); // Use target instead of receiver
				if (isObject(value)) {
					return createImmutable(value);
				}
				return value;
			}

			const value = Reflect.get(target, prop, receiver);

			if (isArray(target)) {
				// Handle array methods
				if (['push', 'pop', 'shift', 'unshift'].includes(String(prop))) {
					throw new Error(
						`Cannot use mutating method ${String(prop)} on immutable array`,
					);
				}
				if (prop === 'map' || prop === 'filter' || prop === 'slice') {
					return (...args: any[]) => createImmutable((target as any)[prop](...args));
				}
			}

			if (isObject(value)) {
				return createImmutable(value);
			}

			return value;
		},
	});
}

// Immer like produce function
export function produce<T extends object>(fn: (draft: T) => void): (state: T) => T {
	return (state: T): T => {
		const handler: ProxyHandler<T> = {
			get(target: T, prop: PropertyKey) {
				const value = target[prop as keyof T];
				if (isObject(value)) {
					return new Proxy(value, handler as ProxyHandler<T[keyof T] & object>);
				}
				return value;
			},
			set(target, prop: string, value: any) {
				(target as Record<string, any>)[prop] = value;
				return true;
			},
			defineProperty(target, prop, descriptor) {
				return Reflect.defineProperty(target, prop, descriptor);
			},
			getOwnPropertyDescriptor(target, prop) {
				return Reflect.getOwnPropertyDescriptor(target, prop);
			},
		};
		const proxy = new Proxy(state, handler);
		fn(proxy);
		return state;
	};
}
