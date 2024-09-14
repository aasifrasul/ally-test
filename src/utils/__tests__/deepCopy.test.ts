import { deepCopy } from '../deepCopy';

describe('deepCopy', () => {
	// Primitive values
	it('should return the same primitive value', () => {
		expect(deepCopy(42)).toBe(42);
		expect(deepCopy('hello')).toBe('hello');
		expect(deepCopy(true)).toBe(true);
		expect(deepCopy(null)).toBe(null);
		expect(deepCopy(undefined)).toBe(undefined);
	});

	// Arrays
	it('should create a deep copy of an array', () => {
		const arr = [1, 2, 3, { a: 1 }, [4, 5]];
		const copy = deepCopy(arr);
		expect(copy).toEqual(arr);
		expect(copy).not.toBe(arr);
		expect(copy[3]).not.toBe(arr[3]);
		expect(copy[3]).toEqual({ a: 1 });
		expect(copy[4]).toEqual([4, 5]);
		expect(copy[4]).not.toBe(arr[4]);
	});

	it('should handle nested arrays', () => {
		const arr = [
			[1, 2],
			[3, 4],
			[5, [6, 7]],
		];
		const copy = deepCopy(arr);
		expect(copy).toEqual(arr);
		expect(copy).not.toBe(arr);
		expect(copy[0][1]).toBe(2);
		expect(copy[2][1]).toEqual([6, 7]);
	});

	// Objects
	it('should create a deep copy of an object', () => {
		const obj = { a: 1, b: { c: 2 }, d: [3, 4] };
		const copy = deepCopy(obj);
		expect(copy).toEqual(obj);
		expect(copy).not.toBe(obj);
		expect(copy.b).not.toBe(obj.b);
		expect(copy.d).not.toBe(obj.d);
		expect(copy.d[0]).toBe(3);
		expect(copy.d[1]).toBe(4);
	});

	it('should handle nested objects', () => {
		const obj = { a: { b: { c: 1 } }, d: { e: { f: 2 } } };
		const copy = deepCopy(obj);
		expect(copy).toEqual(obj);
		expect(copy).not.toBe(obj);
		expect(copy.a.b).not.toBe(obj.a.b);
		expect(copy.d.e.f).toBe(2);
	});

	// Dates
	it('should create a deep copy of a Date object', () => {
		const date = new Date('2023-01-01T00:00:00Z');
		const copy = deepCopy(date);
		expect(copy).toEqual(date);
		expect(copy).not.toBe(date);
		expect(copy.getTime()).toBe(date.getTime());
	});

	// RegExps
	it('should create a deep copy of a RegExp object', () => {
		const regex = /test/gi;
		const copy = deepCopy(regex);
		expect(copy).toEqual(regex);
		expect(copy).not.toBe(regex);
		expect(new RegExp(copy.source, regex.flags)).toEqual(regex);
	});

	// Functions
	it('should create a deep copy of a function', () => {
		const func = () => {
			return 42;
		};
		const copy = deepCopy(func);
		expect(typeof copy).toBe('function');
		expect(copy()).toBe(42);
	});

	// Symbol
	it('should handle Symbols', () => {
		const sym = Symbol('test');
		const obj = { [sym]: 'value' };
		const copy = deepCopy(obj);
		expect(Object.keys(copy)[0]).toBe(sym.toString());
		expect(copy[sym]).toBe('value');
	});

	// Error handling
	it('should handle errors', () => {
		const error = new Error('Test error');
		const copy = deepCopy(error);
		expect(copy.message).toBe(error.message);
		expect(copy.name).toBe(error.name);
	});

	// Circular references
	it('should handle circular references', () => {
		const obj: any = { a: 1 };
		obj.self = obj;
		const copy = deepCopy(obj);

		// Check that the copy has the same structure
		expect(copy).toEqual({ a: 1, self: expect.anything() });

		// Check that the circular reference is preserved
		expect(copy.self).toBe(copy);

		// Check that the copied object is not the same instance as the original
		expect(copy).not.toBe(obj);

		// Check that the properties are correct
		expect(copy.a).toBe(1);
		expect(copy.self.a).toBe(1);
	});

	// Add these to your existing test suite

	it('should handle typed arrays', () => {
		const typedArray = new Int8Array([1, 2, 3]);
		const copy = deepCopy(typedArray);
		expect(copy).toEqual(typedArray);
		expect(copy).not.toBe(typedArray);
	});

	it('should handle Map objects', () => {
		const map = new Map([
			['key1', 'value1'],
			['key2', 'value2'],
		]);
		const copy = deepCopy(map);
		expect(copy).toEqual(map);
		expect(copy).not.toBe(map);
	});

	it('should handle Set objects', () => {
		const set = new Set([1, 2, 3]);
		const copy = deepCopy(set);
		expect(copy).toEqual(set);
		expect(copy).not.toBe(set);
	});

	it('should preserve the prototype chain', () => {
		function TestClass() {
			this.prop = 'value';
		}
		TestClass.prototype.method = function () {};
		const obj = new TestClass();
		const copy = deepCopy(obj);
		expect(copy instanceof TestClass).toBe(true);
		expect(copy.method).toBeDefined();
	});

	it('should copy non-enumerable properties', () => {
		const obj: { prop: string; nonEnumProp: string } = {
			prop: 'value',
			nonEnumProp: '',
		};
		Object.defineProperty(obj, 'nonEnumProp', {
			value: 'non-enum value',
			enumerable: false,
		});
		const copy = deepCopy(obj);
		expect(copy.nonEnumProp).toBe('non-enum value');
	});

	it('should handle getters and setters', () => {
		const obj = {
			_value: 0,
			get value() {
				return this._value;
			},
			set value(v) {
				this._value = v;
			},
		};
		const copy = deepCopy(obj);
		copy.value = 5;
		expect(copy.value).toBe(5);
		expect(obj.value).toBe(0);
	});
});
