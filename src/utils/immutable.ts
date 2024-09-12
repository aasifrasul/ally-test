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
				`This object is immutable, cannot define new property: ${JSON.stringify(
					prop,
				)}`,
			);
		},
		get(target: T, prop: PropertyKey, receiver: any) {
			const value = Reflect.get(target, prop, receiver);

			if (Array.isArray(target)) {
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

			if (typeof value === 'object' && value !== null) {
				return createImmutable(value);
			}
			return value;
		},
	});
}
