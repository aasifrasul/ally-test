import { describe, test, expect, vi } from 'vitest';
import {
	arraySize,
	isEmptyString,
	isEmptyArray,
	isEmptyObject,
	isArray,
	isAsyncFunction,
	isBoolean,
	isEmpty,
	isMap,
	isSet,
	isGeneratorFunction,
	isPromise,
	isDate,
	isSymbol,
	isRegExp,
	isNull,
	isFunction,
	isNumber,
	isObject,
	isString,
	isUndefined,
	safelyExecuteFunction,
	safeAsyncExecute,
} from '../typeChecking';

describe('Type checking functions', () => {
	test('isArray', () => {
		expect(isArray([])).toBe(true);
		expect(isArray({})).toBe(false);
	});

	test('isObject', () => {
		expect(isObject({})).toBe(true);
		expect(isObject([])).toBe(false);
	});

	test('isNull', () => {
		expect(isNull(null)).toBe(true);
		expect(isNull(undefined)).toBe(false);
	});

	test('isUndefined', () => {
		expect(isUndefined(undefined)).toBe(true);
		expect(isUndefined(null)).toBe(false);
	});

	test('isNumber', () => {
		expect(isNumber(42)).toBe(true);
		expect(isNumber('42')).toBe(false);
	});

	test('isString', () => {
		expect(isString('hello')).toBe(true);
		expect(isString(42)).toBe(false);
	});

	test('isBoolean', () => {
		expect(isBoolean(true)).toBe(true);
		expect(isBoolean('true')).toBe(false);
	});

	test('isMap', () => {
		expect(isMap(new Map())).toBe(true);
		expect(isMap({})).toBe(false);
	});

	test('isSet', () => {
		expect(isSet(new Set())).toBe(true);
		expect(isSet([])).toBe(false);
	});

	test('isFunction', () => {
		expect(isFunction(() => {})).toBe(true);
		expect(isFunction({})).toBe(false);
	});

	test('isAsyncFunction', () => {
		const asyncArrowFunc = async () => {};
		const asyncNamedFunc = async function namedAsync() {};
		const regularFunc = () => {};
		const promiseReturningFunc = () => Promise.resolve();

		expect(isAsyncFunction(asyncArrowFunc)).toBe(true);
		expect(isAsyncFunction(asyncNamedFunc)).toBe(true);
		expect(isAsyncFunction(regularFunc)).toBe(false);
		expect(isAsyncFunction(promiseReturningFunc)).toBe(true);
		expect(isAsyncFunction(function () {})).toBe(false);
		expect(isAsyncFunction({})).toBe(false);
		expect(isAsyncFunction(null)).toBe(false);
	});

	test('isGeneratorFunction', () => {
		function* generatorFunc() {
			yield 1;
		}
		const arrowFunc = () => {};
		const regularFunc = function () {};

		expect(isGeneratorFunction(generatorFunc)).toBe(true);
		expect(isGeneratorFunction(function* () {})).toBe(true);
		expect(isGeneratorFunction(arrowFunc)).toBe(false);
		expect(isGeneratorFunction(regularFunc)).toBe(false);
		expect(isGeneratorFunction({})).toBe(false);
		expect(isGeneratorFunction(null)).toBe(false);
	});

	test('isPromise', () => {
		expect(isPromise(Promise.resolve())).toBe(true);
		expect(isPromise({})).toBe(false);
	});

	test('isDate', () => {
		expect(isDate(new Date())).toBe(true);
		expect(isDate('2023-05-17')).toBe(false);
	});

	test('isSymbol', () => {
		expect(isSymbol(Symbol('test'))).toBe(true);
		expect(isSymbol('symbol')).toBe(false);
	});

	test('isRegExp', () => {
		expect(isRegExp(/test/)).toBe(true);
		expect(isRegExp('test')).toBe(false);
	});
});

describe('Utility functions', () => {
	test('arraySize', () => {
		expect(arraySize([1, 2, 3])).toBe(3);
		expect(arraySize([])).toBe(0);
	});

	test('isEmptyString', () => {
		expect(isEmptyString('')).toBe(true);
		expect(isEmptyString('hello')).toBe(false);
		expect(isEmptyString(42)).toBe(false);
	});

	test('isEmptyArray', () => {
		expect(isEmptyArray([])).toBe(true);
		expect(isEmptyArray([1, 2, 3])).toBe(false);
		expect(isEmptyArray({} as unknown[])).toBe(false);
	});

	test('isEmptyObject', () => {
		expect(isEmptyObject({})).toBe(true);
		expect(isEmptyObject({ a: 1 })).toBe(false);
		expect(isEmptyObject([] as unknown as object)).toBe(false);
	});

	test('isEmpty', () => {
		expect(isEmpty(undefined)).toBe(true);
		expect(isEmpty(null)).toBe(true);
		expect(isEmpty('')).toBe(true);
		expect(isEmpty([])).toBe(true);
		expect(isEmpty({})).toBe(true);
		expect(isEmpty('hello')).toBe(false);
		expect(isEmpty([1, 2, 3])).toBe(false);
		expect(isEmpty({ a: 1 })).toBe(false);
	});
});

describe('safelyExecuteFunction', () => {
	test('executes function with no context', () => {
		const testFunc = (a: number, b: number) => a + b;
		expect(safelyExecuteFunction(testFunc, null, 1, 2)).toBe(3);
	});

	test('executes function with context', () => {
		const context = { multiplier: 2 };
		const testFunc = function (this: { multiplier: number }, a: number, b: number) {
			return (a + b) * this.multiplier;
		};
		expect(safelyExecuteFunction(testFunc, context, 1, 2)).toBe(6);
	});

	test('returns undefined for non-function input', () => {
		const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(safelyExecuteFunction(null as any, null)).toBeUndefined();
		expect(warnMock).toHaveBeenCalledWith('Please pass a valid function!');

		warnMock.mockRestore();
	});

	test('handles functions with no return value', () => {
		const testFunc = vi.fn();
		expect(safelyExecuteFunction(testFunc, null)).toBeUndefined();
		expect(testFunc).toHaveBeenCalled();
	});
});

describe('safeAsyncExecute', () => {
	test('executes synchronous function and returns promise', async () => {
		const testFunc = (a: number, b: number) => a + b;
		await expect(safeAsyncExecute(testFunc, 1, 2)).resolves.toBe(3);
	});

	test('executes asynchronous function and returns promise', async () => {
		const testFunc = async (a: number, b: number) => a + b;
		await expect(safeAsyncExecute(testFunc, 1, 2)).resolves.toBe(3);
	});

	test('handles function that returns a promise', async () => {
		const testFunc = () => Promise.resolve('test');
		await expect(safeAsyncExecute(testFunc)).resolves.toBe('test');
	});

	test('handles function with no return value', async () => {
		const testFunc = vi.fn();
		await expect(safeAsyncExecute(testFunc)).resolves.toBeUndefined();
		expect(testFunc).toHaveBeenCalled();
	});

	test('rejects with error for throwing synchronous function', async () => {
		const testFunc = () => {
			throw new Error('Test error');
		};
		await expect(safeAsyncExecute(testFunc)).rejects.toThrow('Test error');
	});

	test('rejects with error for rejecting async function', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const testFunc = async () => {
			throw new Error('Async error');
		};

		await expect(safeAsyncExecute(testFunc)).rejects.toThrow('Async error');

		expect(errorSpy).toHaveBeenCalledWith('An error occurred:', expect.any(Error));

		errorSpy.mockRestore();
	});

	test('logs error to console when function throws', async () => {
		const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

		const testFunc = () => {
			throw new Error('Console log test');
		};

		await expect(safeAsyncExecute(testFunc)).rejects.toThrow();

		expect(consoleErrorMock).toHaveBeenCalledWith('An error occurred:', expect.any(Error));

		consoleErrorMock.mockRestore();
	});

	test('handles non-function input', async () => {
		const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});

		await expect(safeAsyncExecute(null as any)).resolves.toBeNull();
		expect(warnMock).toHaveBeenCalledWith('Please pass a valid function!');

		warnMock.mockRestore();
	});
});
