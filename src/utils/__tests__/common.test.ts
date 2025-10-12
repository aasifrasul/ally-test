import {
	getRandomInt,
	deepCopy,
	compareStrings,
	debounce,
	arraySortLexicalOrder,
	sortMixedArray,
	searchTextOnData,
	buildQueryParams,
	range,
	mapIterable,
	createRangeIterator,
} from '../common';

describe('Common Utility Functions', () => {
	// Test getRandomInt function
	test('getRandomInt should return a random integer within the specified range', () => {
		const min = 1;
		const max = 10;
		const randomInt = getRandomInt(min, max);
		expect(randomInt).toBeGreaterThanOrEqual(min);
		expect(randomInt).toBeLessThanOrEqual(max);
		expect(Number.isInteger(randomInt)).toBe(true);
	});

	// Test deepCopy function
	test('deepCopy should create a deep copy of the given object/array', () => {
		const obj = { name: 'John', age: 30 };
		const copy = deepCopy(obj);
		expect(copy).toEqual(obj);
		expect(copy).not.toBe(obj);
	});

	// Test compareStrings function
	test('compareStrings should compare two strings and return the correct result', () => {
		const str1 = 'apple';
		const str2 = 'banana';
		const result1 = compareStrings(str1, str2);
		const result2 = compareStrings(str2, str1);
		expect(result1).toBeLessThan(0);
		expect(result2).toBeGreaterThan(0);
	});

	// Test debounce function
	test('debounce should delay the execution of a function', () => {
		jest.useFakeTimers();
		const fn = jest.fn();
		const delay = 1000;
		const debouncedFn = debounce(fn, delay);
		debouncedFn();
		expect(fn).not.toBeCalled();
		jest.advanceTimersByTime(delay);
		expect(fn).toBeCalled();
	});

	// Test arraySortLexicalOrder function
	test('arraySortLexicalOrder should sort an array of strings in lexical order', () => {
		const items = ['apple', 'banana', 'cherry'];
		const sortedItems = arraySortLexicalOrder(items);
		expect(sortedItems).toEqual(['apple', 'banana', 'cherry']);
	});

	// Test sortMixedArray function
	test('sortMixedArray should sort an array of mixed types in ascending order', () => {
		const items = [1, 'apple', true, null, undefined];
		const sortedItems = sortMixedArray(items);
		expect(sortedItems).toEqual([null, undefined, 1, 'apple', true]);
	});

	// Test searchTextOnData function
	test('searchTextOnData should search for a text in the given data and return the matching results', () => {
		const searchText = 'apple';
		const searchData = ['apple', 'banana', 'cherry'];
		const searchFields = ['name'];
		const results = searchTextOnData(searchText, searchData, searchFields);
		expect(results).toEqual(['apple']);
	});

	// Test buildQueryParams function
	test('buildQueryParams should build query parameters from the given object', () => {
		const queryParams = { name: 'John', age: 30 };
		const queryString = buildQueryParams(queryParams);
		expect(queryString).toBe('name=John&age=30');
	});

	// Test range function
	test('range should generate an array of numbers within the specified range', () => {
		const start = 1;
		const end = 5;
		const result = range(start, end);
		expect(result).toEqual([1, 2, 3, 4, 5]);
	});

	// Test mapIterable function
	test('mapIterable should apply the callback function to each item in the iterable and return the mapped results', () => {
		const iterable = [1, 2, 3];
		const callback = (item) => item * 2;
		const mappedResult = mapIterable(iterable, callback);
		expect(mappedResult).toEqual([2, 4, 6]);
	});

	// Test createRangeIterator function
	test('createRangeIterator should create an iterator that generates numbers within the specified range', () => {
		const start = 1;
		const end = 3;
		const step = 1;
		const iterator = createRangeIterator(start, end, step);
		const result = Array.from(iterator);
		expect(result).toEqual([1, 2, 3]);
	});
});
