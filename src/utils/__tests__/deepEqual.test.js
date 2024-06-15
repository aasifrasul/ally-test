import { deepEqual } from '../deepEqual';

console.assert(deepEqual(1, 1) === true, 'Test Case 1 Failed');
console.assert(deepEqual(1, '1') === false, 'Test Case 2 Failed');
console.assert(deepEqual({}, {}) === true, 'Test Case 3 Failed');
console.assert(deepEqual({ a: 1 }, { a: 1 }) === true, 'Test Case 4 Failed');
console.assert(deepEqual({ a: 1 }, { a: 2 }) === false, 'Test Case 5 Failed');
console.assert(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }) === true, 'Test Case 6 Failed');
console.assert(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 }) === false, 'Test Case 7 Failed');
console.assert(
	deepEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } }) === true,
	'Test Case 8 Failed',
);
console.assert(
	deepEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 4 } }) === false,
	'Test Case 9 Failed',
);
console.assert(deepEqual(null, null) === true, 'Test Case 10 Failed');
console.assert(deepEqual(null, {}) === false, 'Test Case 11 Failed');
console.assert(
	deepEqual({ a: 1, b: undefined }, { a: 1, b: undefined }) === true,
	'Test Case 12 Failed',
);
console.assert(deepEqual({ a: 1 }, { a: 1, b: undefined }) === false, 'Test Case 13 Failed');
