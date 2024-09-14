import { checkObjectEquality } from '../checkObjectEquality';

describe('checkObjectEquality', () => {
	// Primitive types
	test('compares numbers correctly', () => {
		expect(checkObjectEquality(1, 1)).toBe(true);
		expect(checkObjectEquality(1, 2)).toBe(false);
		expect(checkObjectEquality(0, -0)).toBe(true);
		expect(checkObjectEquality(NaN, NaN)).toBe(true);
	});

	test('compares strings correctly', () => {
		expect(checkObjectEquality('hello', 'hello')).toBe(true);
		expect(checkObjectEquality('hello', 'world')).toBe(false);
		expect(checkObjectEquality('', '')).toBe(true);
	});

	test('compares booleans correctly', () => {
		expect(checkObjectEquality(true, true)).toBe(true);
		expect(checkObjectEquality(false, false)).toBe(true);
		expect(checkObjectEquality(true, false)).toBe(false);
	});

	test('compares null and undefined correctly', () => {
		expect(checkObjectEquality(null, null)).toBe(true);
		expect(checkObjectEquality(undefined, undefined)).toBe(true);
		expect(checkObjectEquality(null, undefined)).toBe(false);
	});

	// Objects
	test('compares simple objects correctly', () => {
		expect(checkObjectEquality({}, {})).toBe(true);
		expect(checkObjectEquality({ a: 1 }, { a: 1 })).toBe(true);
		expect(checkObjectEquality({ a: 1 }, { a: 2 })).toBe(false);
		expect(checkObjectEquality({ a: 1 }, { b: 1 })).toBe(false);
	});

	test('compares nested objects correctly', () => {
		expect(checkObjectEquality({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true);
		expect(checkObjectEquality({ a: { b: 2 } }, { a: { b: 3 } })).toBe(false);
		expect(checkObjectEquality({ a: { b: 2, c: 3 } }, { a: { b: 2 } })).toBe(false);
	});

	// Arrays
	test('compares arrays correctly', () => {
		expect(checkObjectEquality([], [])).toBe(true);
		expect(checkObjectEquality([1, 2, 3], [1, 2, 3])).toBe(true);
		expect(checkObjectEquality([1, 2, 3], [1, 2, 4])).toBe(false);
		expect(checkObjectEquality([1, 2, 3], [1, 2, 3, 4])).toBe(false);
	});

	test('compares nested arrays correctly', () => {
		expect(
			checkObjectEquality(
				[
					[1, 2],
					[3, 4],
				],
				[
					[1, 2],
					[3, 4],
				],
			),
		).toBe(true);
		expect(
			checkObjectEquality(
				[
					[1, 2],
					[3, 4],
				],
				[
					[1, 2],
					[3, 5],
				],
			),
		).toBe(false);
	});

	// Mixed objects and arrays
	test('compares mixed objects and arrays correctly', () => {
		const obj = { a: [1, 2], b: { c: 3 } };
		expect(checkObjectEquality(obj, obj)).toBe(true);
		expect(checkObjectEquality(obj, { ...obj, b: { c: 4 } })).toBe(false);
	});

	// Functions
	test('compares functions correctly', () => {
		const func1 = function () {
			return 1;
		};
		const func2 = function () {
			return 1;
		};
		const func3 = function () {
			return 2;
		};

		expect(checkObjectEquality(func1, func1)).toBe(true);
		expect(checkObjectEquality(func1, func2)).toBe(true);
		expect(checkObjectEquality(func1, func3)).toBe(false);
	});

	// Edge cases
	test('handles circular references', () => {
		const obj1: any = { a: 1 };
		const obj2: any = { a: 1 };
		obj1.b = obj1;
		obj2.b = obj2;

		expect(checkObjectEquality(obj1, obj2)).toBe(true);
	});

	test('compares objects with different key orders', () => {
		expect(checkObjectEquality({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
	});

	test('handles special numeric values', () => {
		expect(checkObjectEquality(Infinity, Infinity)).toBe(true);
		expect(checkObjectEquality(-Infinity, -Infinity)).toBe(true);
		expect(checkObjectEquality(Infinity, -Infinity)).toBe(false);
	});

	// Different types
	test('compares different types correctly', () => {
		expect(checkObjectEquality(1, '1')).toBe(false);
		expect(checkObjectEquality(null, undefined)).toBe(false);
		expect(checkObjectEquality([], {})).toBe(false);
		expect(checkObjectEquality(() => {}, {})).toBe(false);
	});
});
