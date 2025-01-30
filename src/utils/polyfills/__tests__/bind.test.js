import {} from '../bind';

describe('myBind', () => {
	test('should bind context to function', () => {
		const context = { name: 'Alice' };
		const func = function () {
			return this.name;
		};

		const boundFunc = func.myBind(context);
		expect(boundFunc()).toBe('Alice');
	});

	test('should bind context and arguments to function', () => {
		const context = { name: 'Alice' };
		const func = function (greeting) {
			return `${greeting}, ${this.name}`;
		};

		const boundFunc = func.myBind(context, 'Hello');
		expect(boundFunc()).toBe('Hello, Alice');
	});

	test('should bind context and arguments to function when called with arguments', () => {
		const context = { name: 'Alice' };
		const func = function (greeting, punctuation) {
			return `${greeting}, ${this.name}${punctuation}`;
		};

		const boundFunc = func.myBind(context, 'Hello');
		expect(boundFunc('!')).toBe('Hello, Alice!');
	});

	test('should bind context and arguments to function when called with more arguments', () => {
		const context = { name: 'Alice' };
		const func = function (greeting, punctuation) {
			return `${greeting}, ${this.name}${punctuation}`;
		};

		const boundFunc = func.myBind(context, 'Hello', '!');
		expect(boundFunc()).toBe('Hello, Alice!');
	});

	test('should bind context and arguments to function when called with more arguments', () => {
		const context = { name: 'Alice' };
		const func = function (greeting, punctuation) {
			return `${greeting}, ${this.name}${punctuation}`;
		};

		const boundFunc = func.myBind(context, 'Hello', '!');
		expect(boundFunc('!!')).toBe('Hello, Alice!');
	});

	test('should bind context to function when used as constructor', () => {
		const context = { name: 'Alice' };
		const func = function () {
			this.name = 'Bob';
		};

		const boundFunc = func.myBind(context);
		const instance = new boundFunc();
		expect(instance.name).toBe('Bob');
	});

	test('should throw error if called on non-function', () => {
		expect(() => {
			const context = { name: 'Alice' };
			const func = 'not a function';
			func.myBind(context);
		}).toThrow(TypeError);
	});

	test('should throw error if second parameter is not an array or null', () => {
		expect(() => {
			const context = { name: 'Alice' };
			const func = function () {
				return this.name;
			};

			func.myBind(context, { greeting: 'Hello' });
		}).toThrow(TypeError);
	});

	test('should bind context to function with null context', () => {
		const context = null;
		const func = function () {
			return this;
		};

		const boundFunc = func.myBind(context);
		expect(boundFunc()).toBe(globalThis);
	});
});
