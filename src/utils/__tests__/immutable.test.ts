import { createImmutable } from '../immutable';

describe('createImmutable', () => {
	it('should create an immutable object', () => {
		const obj = { a: 1, b: 2 };
		const immutableObj = createImmutable(obj);

		expect(() => {
			(immutableObj as any).a = 3;
		}).toThrow('This object is immutable, cannot set property: "a"');

		expect(() => {
			delete (immutableObj as any).b;
		}).toThrow('This object is immutable, cannot delete property: "b"');

		expect(() => {
			Object.defineProperty(immutableObj, 'c', { value: 3 });
		}).toThrow('This object is immutable, cannot define new property: "c"');
	});

	it('should create an immutable nested object', () => {
		const obj = { a: 1, b: { c: 2 } };
		const immutableObj = createImmutable(obj);

		expect(() => {
			(immutableObj.b as any).c = 3;
		}).toThrow('This object is immutable, cannot set property: "c"');

		expect(() => {
			delete (immutableObj.b as any).c;
		}).toThrow('This object is immutable, cannot delete property: "c"');

		expect(() => {
			Object.defineProperty(immutableObj.b, 'd', { value: 4 });
		}).toThrow('This object is immutable, cannot define new property: "d"');
	});

	it('should create an immutable array', () => {
		const arr = [1, 2, 3];
		const immutableArr = createImmutable(arr);

		expect(() => {
			(immutableArr as any).push(4);
		}).toThrow('Cannot use mutating method push on immutable array');

		expect(() => {
			(immutableArr as any).pop();
		}).toThrow('Cannot use mutating method pop on immutable array');

		expect(() => {
			(immutableArr as any).shift();
		}).toThrow('Cannot use mutating method shift on immutable array');

		expect(() => {
			(immutableArr as any).unshift(0);
		}).toThrow('Cannot use mutating method unshift on immutable array');
	});

	it('should allow non-mutating array methods', () => {
		const arr = [1, 2, 3];
		const immutableArr = createImmutable(arr);

		const mappedArr = immutableArr.map((x) => x * 2);
		expect(mappedArr).toEqual([2, 4, 6]);

		const filteredArr = immutableArr.filter((x) => x > 1);
		expect(filteredArr).toEqual([2, 3]);

		const slicedArr = immutableArr.slice(1, 2);
		expect(slicedArr).toEqual([2]);
	});

	it('should handle nested arrays', () => {
		const obj = { a: [1, 2, 3] };
		const immutableObj = createImmutable(obj);

		expect(() => {
			(immutableObj.a as any).push(4);
		}).toThrow('Cannot use mutating method push on immutable array');

		const mappedArr = immutableObj.a.map((x) => x * 2);
		expect(mappedArr).toEqual([2, 4, 6]);
	});

	it('should handle primitive values', () => {
		const obj = { a: 1, b: true, c: 'hello' };
		const immutableObj = createImmutable(obj);

		expect(() => {
			(immutableObj.a as any) = 2;
		}).toThrow('This object is immutable, cannot set property: "a"');

		expect(() => {
			(immutableObj.b as any) = false;
		}).toThrow('This object is immutable, cannot set property: "b"');

		expect(() => {
			(immutableObj.c as any) = 'world';
		}).toThrow('This object is immutable, cannot set property: "c"');
	});

	it('should handle circular references', () => {
		const obj = { a: { circularRef: {} }, b: { circularRef: {} } };
		(obj.a.circularRef as any) = obj.b;
		(obj.b.circularRef as any) = obj.a;

		const immutableObj = createImmutable(obj);

		expect(() => {
			(immutableObj.a.circularRef as any).x = 42;
		}).toThrow('This object is immutable, cannot set property: "x"');
	});

	it('should handle deep nested objects', () => {
		const obj = { a: { b: { c: { d: 42 } } } };
		const immutableObj = createImmutable(obj);

		expect(() => {
			(immutableObj.a.b.c.d as any) = 43;
		}).toThrow('This object is immutable, cannot set property: "d"');

		expect(immutableObj.a.b.c.d).toBe(42);
	});

	it('should handle frozen objects', () => {
		const obj = Object.freeze({ a: 1, b: 2 });
		const immutableObj = createImmutable(obj);

		expect(() => {
			(immutableObj as any).a = 3;
		}).toThrow('This object is immutable, cannot set property: "a"');
	});

	it('should handle Symbol properties', () => {
		const symbolKey = Symbol('test');
		const obj = { [symbolKey]: 'value' };
		const immutableObj = createImmutable(obj);

		expect(() => {
			(immutableObj as any)[symbolKey] = 'new value';
		}).toThrow('This object is immutable, cannot set property: Symbol(test)');
	});
});
