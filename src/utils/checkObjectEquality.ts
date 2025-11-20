export function checkObjectEquality(data1: any, data2: any, seen = new WeakSet()): boolean {
	if (typeof data1 !== typeof data2) return false;
	if (typeof data1 === 'function') return data1.toString() === data2.toString();
	if (typeof data1 !== 'object' || data1 === null || data2 === null) return data1 === data2;

	if (seen.has(data1) || seen.has(data2)) return true;
	seen.add(data1);
	seen.add(data2);

	if (Array.isArray(data1) !== Array.isArray(data2)) return false;

	if (Array.isArray(data1)) {
		if (data1.length !== data2.length) return false;
		return data1.every((v, i) => checkObjectEquality(v, data2[i], seen));
	}

	if (data1 instanceof Date && data2 instanceof Date)
		return data1.getTime() === data2.getTime();

	if (data1 instanceof RegExp && data2 instanceof RegExp)
		return data1.toString() === data2.toString();

	if (data1 instanceof Set && data2 instanceof Set)
		return data1.size === data2.size && [...data1].every((v) => data2.has(v));

	if (data1 instanceof Map && data2 instanceof Map)
		return (
			data1.size === data2.size &&
			[...data1.entries()].every(
				([k, v]) => data2.has(k) && checkObjectEquality(v, data2.get(k), seen),
			)
		);

	const keys1 = Object.keys(data1);
	const keys2 = Object.keys(data2);
	if (keys1.length !== keys2.length) return false;

	return keys1.every(
		(key) =>
			Object.prototype.hasOwnProperty.call(data2, key) &&
			checkObjectEquality(data1[key], data2[key], seen),
	);
}
