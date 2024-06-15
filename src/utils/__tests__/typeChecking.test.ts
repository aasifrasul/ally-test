const {
	isArray,
	isEmpty,
	isFunction,
	isNumber,
	isObject,
	isString,
	safelyExecuteFunction,
} = require('../typeChecking');

test('returns true for number type', () => {
	expect(isNumber(5)).toBe(true);
});

test('returns false for non-number type', () => {
	expect(isNumber('hello')).toBe(false);
});

test('returns true for string type', () => {
	expect(isString('test')).toBe(true);
});

test('returns false for non-string type', () => {
	expect(isString(123)).toBe(false);
});

test('returns true for array type', () => {
	expect(isArray([1, 2, 3])).toBe(true);
});

test('returns false for non-array type', () => {
	expect(isArray('not array')).toBe(false);
});
test('returns true for object type', () => {
	expect(isObject({ a: 1 })).toBe(true);
});

test('returns false for non-object type', () => {
	expect(isObject(null)).toBe(false);
});

test('returns true for function type', () => {
	expect(isFunction(() => {})).toBe(true);
});

test('returns false for non-function type', () => {
	expect(isFunction(123)).toBe(false);
});

test('returns true for empty array', () => {
	expect(isEmpty([])).toBe(true);
});

test('returns false for non-empty array', () => {
	expect(isEmpty([1])).toBe(false);
});

test('returns true for empty object', () => {
	expect(isEmpty({})).toBe(true);
});

test('returns false for non-empty object', () => {
	expect(isEmpty({ a: 1 })).toBe(false);
});

test('returns true for empty string', () => {
	expect(isEmpty('')).toBe(true);
});

test('returns false for non-empty string', () => {
	expect(isEmpty('test')).toBe(false);
});

test('returns true for null', () => {
	expect(isEmpty(null)).toBe(true);
});

test('returns true for undefined', () => {
	expect(isEmpty(undefined)).toBe(true);
});

test('safely executes function without error', () => {
	const func = jest.fn();
	safelyExecuteFunction(func);
	expect(func).toHaveBeenCalled();
});

test('safely executes function and returns correct value', () => {
	const func = jest.fn(() => 'result');
	const result = safelyExecuteFunction(func);
	expect(func).toHaveBeenCalled();
	expect(result).toBe('result');
});

test('safely executes function with arguments', () => {
	const func = jest.fn().mockImplementation((a, b) => a + b);
	const result = safelyExecuteFunction(func, null, 1, 2);
	expect(func).toHaveBeenCalledWith(1, 2);
	expect(result).toBe(3);
});

test('safely executes function with no arguments', () => {
	const func = jest.fn();
	const result = safelyExecuteFunction(func);
	expect(func).toHaveBeenCalled();
	expect(result).toBeUndefined();
});

test('safely executes async function and returns resolved value', async () => {
	const func = jest.fn(async () => 'async result');
	const result = await safelyExecuteFunction(func);
	expect(func).toHaveBeenCalled();
	expect(result).toBe('async result');
});

test('safely executes function with multiple arguments and correct context', () => {
	const context = { value: 10 };
	const func = jest.fn(function (a, b) {
		return this.value + a + b;
	});
	const result = safelyExecuteFunction(func, context, 1, 2);
	expect(func).toHaveBeenCalledWith(1, 2);
	expect(result).toBe(13);
});

test('safely executes function with undefined context', () => {
	const func = jest.fn(function () {
		return this;
	});
	const result = safelyExecuteFunction(func);
	expect(func).toHaveBeenCalled();
	expect(result).toBeUndefined();
});

test('safely executes function and maintains correct binding', () => {
	const context = { value: 20 };
	function testFunc(a) {
		return this.value + a;
	}
	const boundFunc = testFunc.bind(context);
	const result = safelyExecuteFunction(boundFunc, null, 5);
	expect(result).toBe(25);
});

test('safely executes function with array arguments', () => {
	const func = jest.fn((...args) => args);
	const result = safelyExecuteFunction(func, null, 1, 2, 3);
	expect(func).toHaveBeenCalledWith(1, 2, 3);
	expect(result).toEqual([1, 2, 3]);
});
