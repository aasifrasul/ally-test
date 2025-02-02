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
						if (result instanceof MyPromise) {
							result.then(handler.resolve, handler.reject);
						} else {
							handler.resolve(result);
						}
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

	static resolve(value) {
		return new MyPromise((resolve) => resolve(value));
	}

	static reject(error) {
		return new MyPromise((_, reject) => reject(error));
	}

	// Fulfills when all of the promises fulfill; rejects when any of the promises rejects.
	static all(promises) {
		return new MyPromise((resolve, reject) => {
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
				if (promise instanceof MyPromise) {
					promise.then((value) => {
						results[index] = value;
						checkCompletion();
					}, reject);
				} else {
					results[index] = promise;
					checkCompletion();
				}
			});
		});
	}

	// Fulfills when any of the promises fulfills; rejects when all of the promises reject.
	static race(promises) {
		return new MyPromise((resolve, reject) => {
			promises.forEach((promise) => {
				if (promise instanceof MyPromise) {
					promise.then(resolve, reject);
				} else {
					resolve(promise);
				}
			});
		});
	}

	// Fulfills when all of the promises settle (either fulfill or reject).
	static allSettled(promises) {
		return new MyPromise((resolve) => {
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
				if (promise instanceof MyPromise) {
					promise.then(
						(value) => {
							results[index] = { status: 'fulfilled', value };
							checkCompletion();
						},
						(reason) => {
							results[index] = { status: 'rejected', reason };
							checkCompletion();
						},
					);
				} else {
					results[index] = { status: 'fulfilled', value: promise };
					checkCompletion();
				}
			});
		});
	}

	// Settles when any of the promises settles.
	// In other words, fulfills when any of the promises fulfills;
	// rejects when any of the promises rejects.
	static any(promises) {
		return new MyPromise((resolve, reject) => {
			let rejectedCount = 0;

			if (promises.length === 0) {
				resolve();
				return;
			}

			promises.forEach((promise) => {
				if (promise instanceof MyPromise) {
					promise.then(resolve, () => {
						rejectedCount++;
						if (rejectedCount === promises.length) {
							reject(new AggregateError('All promises were rejected'));
						}
					});
				} else {
					resolve(promise);
				}
			});
		});
	}
}
