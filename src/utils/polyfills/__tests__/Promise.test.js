import { MyPromise } from '../Promise';

describe('MyPromise', () => {
	describe('Constructor', () => {
		test('should create a pending promise', () => {
			const promise = new MyPromise(() => {});
			expect(promise.state).toBe(MyPromise.PENDING);
			expect(promise.value).toBe(undefined);
		});

		test('should throw if executor is not a function', () => {
			expect(() => new MyPromise(null)).toThrow(TypeError);
			expect(() => new MyPromise('not a function')).toThrow(TypeError);
		});

		test('should execute the executor immediately', () => {
			const executor = jest.fn();
			new MyPromise(executor);
			expect(executor).toHaveBeenCalledTimes(1);
		});

		test('should handle executor throwing error', () => {
			const error = new Error('Executor error');
			const promise = new MyPromise(() => {
				throw error;
			});
			expect(promise.state).toBe(MyPromise.REJECTED);
			expect(promise.value).toBe(error);
		});
	});

	describe('then', () => {
		test('should handle non-function handlers by passing through values', async () => {
			const promise = MyPromise.resolve(1);
			const result = await promise
				.then(undefined)
				.then(null)
				.then((value) => value + 1);
			expect(result).toBe(2);
		});

		test('should chain promises and handle fulfillment', async () => {
			const promise = MyPromise.resolve(1);
			const result = await promise.then((value) => value + 1).then((value) => value + 1);
			expect(result).toBe(3);
		});

		test('should handle rejections in chain', async () => {
			const error = new Error('Test error');
			const promise = MyPromise.reject(error);
			let caught;

			await promise
				.then((value) => value)
				.catch((err) => {
					caught = err;
				});

			expect(caught).toBe(error);
		});
	});

	describe('catch', () => {
		test('should handle rejected promises', async () => {
			const error = new Error('Test error');
			const promise = MyPromise.reject(error);
			const caught = await promise.catch((err) => 'caught');
			expect(caught).toBe('caught');
		});

		test('should pass through if no error occurs', async () => {
			const promise = MyPromise.resolve(1);
			const result = await promise.catch((err) => 'error').then((value) => value + 1);
			expect(result).toBe(2);
		});
	});

	describe('finally', () => {
		test('should always execute callback', async () => {
			const finallyCb = jest.fn();
			await MyPromise.resolve(1).finally(finallyCb);
			expect(finallyCb).toHaveBeenCalled();

			try {
				await MyPromise.reject(new Error()).finally(finallyCb);
			} catch (e) {}
			expect(finallyCb).toHaveBeenCalledTimes(2);
		});

		test('should pass through values', async () => {
			const result = await MyPromise.resolve(1)
				.finally(() => 2)
				.then((value) => value);
			expect(result).toBe(1);
		});

		test('should pass through errors', async () => {
			const error = new Error('Test error');
			let caught;

			await MyPromise.reject(error)
				.finally(() => {})
				.catch((err) => {
					caught = err;
				});

			expect(caught).toBe(error);
		});
	});

	describe('Static Methods', () => {
		describe('resolve', () => {
			test('should create fulfilled promise with value', async () => {
				const promise = MyPromise.resolve(1);
				const value = await promise;
				expect(value).toBe(1);
			});

			test('should handle promise as value', async () => {
				const innerPromise = MyPromise.resolve(1);
				const promise = MyPromise.resolve(innerPromise);
				const value = await promise;
				expect(value).toBe(1);
			});
		});

		describe('reject', () => {
			test('should create rejected promise with error', async () => {
				const error = new Error('Test error');
				const promise = MyPromise.reject(error);
				let caught;

				await promise.catch((err) => {
					caught = err;
				});

				expect(caught).toBe(error);
			});
		});

		describe('all', () => {
			test('should resolve with array of values', async () => {
				const promises = [
					MyPromise.resolve(1),
					MyPromise.resolve(2),
					MyPromise.resolve(3),
				];

				const results = await MyPromise.all(promises);
				expect(results).toEqual([1, 2, 3]);
			});

			test('should handle mix of promises and values', async () => {
				const promises = [1, MyPromise.resolve(2), 3];

				const results = await MyPromise.all(promises);
				expect(results).toEqual([1, 2, 3]);
			});

			test('should reject if any promise rejects', async () => {
				const error = new Error('Test error');
				const promises = [
					MyPromise.resolve(1),
					MyPromise.reject(error),
					MyPromise.resolve(3),
				];

				let caught;
				await MyPromise.all(promises).catch((err) => {
					caught = err;
				});

				expect(caught).toBe(error);
			});

			test('should resolve with empty array for empty input', async () => {
				const results = await MyPromise.all([]);
				expect(results).toEqual([]);
			});
		});

		describe('race', () => {
			test('should resolve with first resolved value', async () => {
				let resolve1, resolve2;
				const p1 = new MyPromise((r) => {
					resolve1 = r;
				});
				const p2 = new MyPromise((r) => {
					resolve2 = r;
				});

				const racePromise = MyPromise.race([p1, p2]);

				// Resolve p2 first
				resolve2(2);
				resolve1(1);

				const result = await racePromise;
				expect(result).toBe(2);
			});

			test('should reject with first rejection', async () => {
				let resolve, reject;
				const p1 = new MyPromise((r) => {
					resolve = r;
				});
				const p2 = new MyPromise((_, j) => {
					reject = j;
				});

				const error = new Error('Test error');
				const racePromise = MyPromise.race([p1, p2]);

				// Reject p2 first
				reject(error);
				resolve(1);

				await expect(racePromise).rejects.toBe(error);
			});
		});
	});

	describe('Edge Cases', () => {
		test('should handle nested promises', async () => {
			const promise = MyPromise.resolve(1)
				.then((value) => MyPromise.resolve(value + 1))
				.then((value) => MyPromise.resolve(value + 1));

			const result = await promise;
			expect(result).toBe(3);
		});

		test('should handle errors in handlers', async () => {
			const error = new Error('Handler error');
			const promise = MyPromise.resolve(1).then(() => {
				throw error;
			});

			let caught;
			await promise.catch((err) => {
				caught = err;
			});

			expect(caught).toBe(error);
		});

		test('should maintain order of microtasks', async () => {
			const order = [];
			await MyPromise.resolve()
				.then(() => order.push(1))
				.then(() => order.push(2))
				.then(() => order.push(3));

			expect(order).toEqual([1, 2, 3]);
		});
	});
});
