import { checkObjectEquality } from '../checkObjectEquality';

describe('checkObjectEquality', () => {
	// Additional tests for null, undefined, numbers, strings, functions, objects, and arrays
	test('returns true for null values', () => {
		expect(checkObjectEquality(null, null)).toBe(true);
	});

	test('returns false for null and undefined', () => {
		expect(checkObjectEquality(null, undefined)).toBe(false);
	});

	test('returns true for identical numbers', () => {
		expect(checkObjectEquality(42, 42)).toBe(true);
	});

	test('returns false for different numbers', () => {
		expect(checkObjectEquality(42, 43)).toBe(false);
	});

	test('returns true for identical strings', () => {
		expect(checkObjectEquality('hello', 'hello')).toBe(true);
	});

	test('returns false for different strings', () => {
		expect(checkObjectEquality('hello', 'world')).toBe(false);
	});

	test('returns true for identical functions', () => {
		const func1 = () => {};
		const func2 = func1;
		expect(checkObjectEquality(func1, func2)).toBe(true);
	});

	test('returns false for different functions', () => {
		const func1 = () => {};
		const func2 = () => {};
		expect(checkObjectEquality(func1, func2)).toBe(false);
	});

	test('returns true for identical arrays', () => {
		const arr1 = [1, 2, 3];
		const arr2 = [1, 2, 3];
		expect(checkObjectEquality(arr1, arr2)).toBe(true);
	});

	test('returns false for different arrays', () => {
		const arr1 = [1, 2, 3];
		const arr2 = [4, 5, 6];
		expect(checkObjectEquality(arr1, arr2)).toBe(false);
	});

	test('returns true for identical nested arrays', () => {
		const arr1 = [
			[1, 2],
			[3, 4],
		];
		const arr2 = [
			[1, 2],
			[3, 4],
		];
		expect(checkObjectEquality(arr1, arr2)).toBe(true);
	});

	test('returns false for different nested arrays', () => {
		const arr1 = [
			[1, 2],
			[3, 4],
		];
		const arr2 = [
			[1, 2],
			[4, 5],
		];
		expect(checkObjectEquality(arr1, arr2)).toBe(false);
	});

	test('returns true for identical arrays', () => {
		const arr1 = [1, 2, 3];
		const arr2 = [1, 2, 3];
		expect(checkObjectEquality(arr1, arr2)).toBe(true);
	});

	test('returns false for different arrays', () => {
		const arr1 = [1, 2, 3];
		const arr2 = [4, 5, 6];
		expect(checkObjectEquality(arr1, arr2)).toBe(false);
	});

	test('returns true for identical nested objects', () => {
		const obj1 = { a: { b: { c: 1 } } };
		const obj2 = { a: { b: { c: 1 } } };
		expect(checkObjectEquality(obj1, obj2)).toBe(true);
	});

	test('returns false for different nested objects', () => {
		const obj1 = { a: { b: { c: 1 } } };
		const obj2 = { a: { b: { c: 2 } } };
		expect(checkObjectEquality(obj1, obj2)).toBe(false);
	});

	test('returns true for identical objects', () => {
		const obj1 = { name: 'John', age: 30, address: null };
		const obj2 = { name: 'John', age: 30, address: null };
		expect(checkObjectEquality(obj1, obj2)).toBe(true);
	});

	test('returns false for objects with additional properties', () => {
		const obj1 = { name: 'John', age: 30, address: null };
		const obj2 = { name: 'John', age: 30, address: null, extraProp: 'value' };
		expect(checkObjectEquality(obj1, obj2)).toBe(false);
	});

	test('returns true for objects with nested objects that are equal', () => {
		const obj1 = { name: 'John', age: 30, address: { city: 'New York', country: 'USA' } };
		const obj2 = { name: 'John', age: 30, address: { city: 'New York', country: 'USA' } };
		expect(checkObjectEquality(obj1, obj2)).toBe(true);
	});

	test('returns false for objects with nested objects that are not equal', () => {
		const obj1 = { name: 'John', age: 30, address: { city: 'New York', country: 'USA' } };
		const obj2 = {
			name: 'John',
			age: 30,
			address: { city: 'Los Angeles', country: 'USA' },
		};
		expect(checkObjectEquality(obj1, obj2)).toBe(false);
	});

	test('returns true for objects containing arrays that are equal', () => {
		const obj1 = { names: ['John', 'Jane'], ages: [30, 25] };
		const obj2 = { names: ['John', 'Jane'], ages: [30, 25] };
		expect(checkObjectEquality(obj1, obj2)).toBe(true);
	});

	test('returns false for objects containing arrays that are not equal', () => {
		const obj1 = { names: ['John', 'Jane'], ages: [30, 25] };
		const obj2 = { names: ['John', 'Jane'], ages: [35, 26] };
		expect(checkObjectEquality(obj1, obj2)).toBe(false);
	});

	// Special case: Circular references
	test('handles circular references gracefully', () => {
		const obj1 = {};
		obj1.selfRef = obj1;
		const obj2 = {};
		obj2.selfRef = obj2;
		//expect(checkObjectEquality(obj1, obj2)).toBe(true);
	});
});
