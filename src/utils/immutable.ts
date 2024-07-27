export function createImmutable<T extends object>(obj: T): T {
	return new Proxy(obj, {
		set: () => {
			throw new Error('This object is immutable');
		},
	});
}
