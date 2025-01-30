import {} from '../Apply';

describe('apply', () => {
	test('should apply function with context and arguments', () => {
		const context = { value: 1 };
		function add(a, b) {
			return this.value + a + b;
		}

		expect(add.myApply(context, [2, 3])).toBe(6);
	});

	test('should apply function with context and no arguments', () => {
		const context = { value: 1 };
		function add(a, b) {
			return this.value + a + b;
		}

		expect(add.myApply(context)).toBe(NaN);
	});

	test('should apply function with no context and arguments', () => {
		function add(a, b) {
			return a + b;
		}

		expect(add.myApply(null, [2, 3])).toBe(5);
	});

	test('should apply function with no context and no arguments', () => {
		function add(a, b) {
			return a + b;
		}

		expect(add.myApply(null)).toBe(NaN);
	});

	test('should throw error if not called on a function', () => {
		expect(() => {
			const context = { value: 1 };
			const add = 1;
			add.myApply(context, [2, 3]);
		}).toThrow(TypeError);
	});

	test('should throw error if second parameter is not an array or null', () => {
		expect(() => {
			const context = { value: 1 };
			function add(a, b) {
				return this.value + a + b;
			}

			add.myApply(context, { a: 2, b: 3 });
		}).toThrow(TypeError);
	});
});
