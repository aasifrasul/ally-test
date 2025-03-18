export class MyPromise {
	static PENDING = 'pending';
	static FULFILLED = 'fulfilled';
	static REJECTED = 'rejected';

	constructor(executor) {
		if (typeof executor !== 'function') {
			throw new TypeError('Executor must be a function');
		}

		this.state = MyPromise.PENDING;
		this.value = undefined;
		this.handlers = [];

		try {
			executor(this.resolve.bind(this), this.reject.bind(this));
		} catch (error) {
			this.reject(error);
		}
	}

	resolve(value) {
		// Handle promise resolution with another promise
		if (value instanceof MyPromise) {
			value.then(
				(val) => this.settle(MyPromise.FULFILLED, val),
				(err) => this.settle(MyPromise.REJECTED, err),
			);
			return;
		}
		this.settle(MyPromise.FULFILLED, value);
	}

	reject(error) {
		this.settle(MyPromise.REJECTED, error);
	}

	settle(state, value) {
		if (this.state !== MyPromise.PENDING) {
			return;
		}

		this.state = state;
		this.value = value;
		this.executeHandlers();
	}

	then(onFulfilled, onRejected) {
		return new MyPromise((resolve, reject) => {
			this.handlers.push({
				onFulfilled:
					typeof onFulfilled === 'function' ? onFulfilled : (value) => value,
				onRejected:
					typeof onRejected === 'function'
						? onRejected
						: (error) => {
								throw error;
							},
				resolve,
				reject,
			});

			this.executeHandlers();
		});
	}

	catch(onRejected) {
		return this.then(null, onRejected);
	}

	finally(onFinally) {
		if (typeof onFinally !== 'function') {
			return this.then();
		}

		return this.then(
			(value) => MyPromise.resolve(onFinally()).then(() => value),
			(error) =>
				MyPromise.resolve(onFinally()).then(() => {
					throw error;
				}),
		);
	}

	executeHandlers() {
		if (this.state === MyPromise.PENDING) {
			return;
		}

		this.handlers.forEach((handler) => {
			queueMicrotask(() => {
				try {
					const callback =
						this.state === MyPromise.FULFILLED
							? handler.onFulfilled
							: handler.onRejected;

					if (callback) {
						const result = callback(this.value);
						this.resolvePromise(handler.resolve, handler.reject, result);
					} else if (this.state === MyPromise.FULFILLED) {
						handler.resolve(this.value);
					} else {
						handler.reject(this.value);
					}
				} catch (error) {
					handler.reject(error);
				}
			});
		});

		this.handlers = [];
	}

	// Helper function to handle promise resolution procedure
	resolvePromise(resolve, reject, value) {
		// Prevent circular promise chain
		if (value === this) {
			reject(new TypeError('Promise cannot resolve to itself'));
			return;
		}

		if (value instanceof MyPromise) {
			value.then(resolve, reject);
		} else {
			resolve(value);
		}
	}

	static resolve(value) {
		if (value instanceof MyPromise) return value;
		return new MyPromise((resolve) => resolve(value));
	}

	static reject(error) {
		return new MyPromise((_, reject) => reject(error));
	}

	// waits for all promises to fulfill,
	// but rejects immediately if any promise rejects
	static all(promises) {
		return new MyPromise((resolve, reject) => {
			if (!Array.isArray(promises)) {
				return reject(new TypeError('promises must be an array'));
			}

			const results = new Array(promises.length);
			let completed = 0;

			if (promises.length === 0) {
				resolve(results);
				return;
			}

			const checkCompletion = () => {
				completed++;
				if (completed === promises.length) {
					resolve(results);
				}
			};

			promises.forEach((promise, index) => {
				MyPromise.resolve(promise).then((value) => {
					results[index] = value;
					checkCompletion();
				}, reject);
			});
		});
	}

	// always waits for all promises to settle (either fulfill or reject),
	// and never rejects
	static allSettled(promises) {
		return new MyPromise((resolve, reject) => {
			if (!Array.isArray(promises)) {
				return reject(new TypeError('promises must be an array'));
			}

			const results = new Array(promises.length);
			let completed = 0;

			if (promises.length === 0) {
				resolve(results);
				return;
			}

			const checkCompletion = () => {
				completed++;
				if (completed === promises.length) {
					resolve(results);
				}
			};

			promises.forEach((promise, index) => {
				MyPromise.resolve(promise).then(
					(value) => {
						results[index] = { status: 'fulfilled', value };
						checkCompletion();
					},
					(reason) => {
						results[index] = { status: 'rejected', reason };
						checkCompletion();
					},
				);
			});
		});
	}

	// resolves or rejects with the outcome of the first settled promise,
	// whether it's fulfilled or rejected
	static race(promises) {
		return new MyPromise((resolve, reject) => {
			if (!Array.isArray(promises)) {
				return reject(new TypeError('promises must be an array'));
			}

			if (promises.length === 0) {
				return; // Race remains pending if array is empty
			}

			promises.forEach((promise) => {
				MyPromise.resolve(promise).then(resolve, reject);
			});
		});
	}

	// resolves with the value of the first fulfilled promise,
	// ignoring rejections until all promises reject
	static any(promises) {
		return new MyPromise((resolve, reject) => {
			if (!Array.isArray(promises)) {
				return reject(new TypeError('promises must be an array'));
			}

			const errors = new Array(promises.length);
			let rejectedCount = 0;

			if (promises.length === 0) {
				reject(new AggregateError([], 'All promises were rejected'));
				return;
			}

			promises.forEach((promise, index) => {
				MyPromise.resolve(promise).then(resolve, (error) => {
					errors[index] = error;
					rejectedCount++;

					if (rejectedCount === promises.length) {
						reject(new AggregateError(errors, 'All promises were rejected'));
					}
				});
			});
		});
	}
}
