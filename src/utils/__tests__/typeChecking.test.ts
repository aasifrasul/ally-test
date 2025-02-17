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
	safeExecute,
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
		expect(isEmptyArray({} as unknown[])).toBe(false); // Fixed: Cast empty object to unknown[]
	});

	test('isEmptyObject', () => {
		expect(isEmptyObject({})).toBe(true);
		expect(isEmptyObject({ a: 1 })).toBe(false);
		expect(isEmptyObject([] as unknown as object)).toBe(false); // Fixed: Cast empty array to object
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
		console.log = jest.fn();
		expect(safelyExecuteFunction(null as unknown as () => void, null)).toBeUndefined();
		expect(console.warn).toHaveBeenCalledWith('Please pass a valid function!');
	});

	test('handles functions with no return value', () => {
		const testFunc = jest.fn();
		expect(safelyExecuteFunction(testFunc, null)).toBeUndefined();
		expect(testFunc).toHaveBeenCalled();
	});
});

describe('safeExecute', () => {
	test('executes synchronous function and returns promise', async () => {
		const testFunc = (a: number, b: number) => a + b;
		await expect(safeExecute(testFunc, 1, 2)).resolves.toBe(3);
	});

	test('executes asynchronous function and returns promise', async () => {
		const testFunc = async (a: number, b: number) => a + b;
		await expect(safeExecute(testFunc, 1, 2)).resolves.toBe(3);
	});

	test('handles function that returns a promise', async () => {
		const testFunc = () => Promise.resolve('test');
		await expect(safeExecute(testFunc)).resolves.toBe('test');
	});

	test('handles function with no return value', async () => {
		const testFunc = jest.fn();
		await expect(safeExecute(testFunc)).resolves.toBeUndefined();
		expect(testFunc).toHaveBeenCalled();
	});

	test('rejects with error for throwing synchronous function', async () => {
		const testFunc = () => {
			throw new Error('Test error');
		};
		await expect(safeExecute(testFunc)).rejects.toThrow('Test error');
	});

	test('rejects with error for rejecting asynchronous function', async () => {
		const originalConsoleError = console.error;
		console.error = jest.fn();

		const testFunc = async () => {
			throw new Error('Async error');
		};
		await expect(safeExecute(testFunc)).rejects.toThrow('Async error');

		expect(console.error).toHaveBeenCalledWith('An error occurred:', expect.any(Error));

		console.error = originalConsoleError;
	});

	test('logs error to console when function throws', async () => {
		// Mock console.error
		const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

		const testFunc = () => {
			throw new Error('Console log test');
		};

		try {
			await safeExecute(testFunc);
		} catch (e) {
			// Expected to throw, so we catch it to prevent the test from failing
		}

		// Verify console.error was called with the expected message
		expect(consoleErrorMock).toHaveBeenCalledWith('An error occurred:', expect.any(Error));

		// Restore the original console.error
		consoleErrorMock.mockRestore();
	});

	test('handles non-function input', async () => {
		const originalConsoleWarn = console.warn;
		console.warn = jest.fn();

		await expect(safeExecute(null as unknown as () => void)).resolves.toBeNull();
		expect(console.warn).toHaveBeenCalledWith('Please pass a valid function!');

		console.warn = originalConsoleWarn;
	});
});
