export async function parallel<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
	return Promise.all(tasks.map((task) => task()));
}

export async function series<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
	const results: T[] = [];
	for (const task of tasks) {
		results.push(await task());
	}
	return results;
}

export async function waterfall<T>(
	tasks: ((input: any) => Promise<any>)[],
	initialValue?: any,
): Promise<T> {
	let result = initialValue;
	for (const task of tasks) {
		result = await task(result);
	}
	return result;
}

export function parallelLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
	return new Promise((resolve, reject) => {
		const results: T[] = new Array(tasks.length);
		let i = 0;
		let running = 0;
		let completed = 0;
		let hasError = false;
		function runNext() {
			if (completed === tasks.length) {
				resolve(results);
				return;
			}
			while (running < limit && i < tasks.length) {
				const index = i++;
				running++;
				tasks[index]()
					.then((res) => {
						results[index] = res;
						running--;
						completed++;
						runNext();
					})
					.catch((err) => {
						if (!hasError) {
							hasError = true;
							reject(err);
						}
					});
			}
		}
		runNext();
	});
}

export function mapLimit<T, R>(
	items: T[],
	limit: number,
	iteratee: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const tasks = items.map((item, i) => () => iteratee(item, i));
	return parallelLimit(tasks, limit);
}

export async function eachLimit<T>(
	items: T[],
	limit: number,
	iteratee: (item: T, index: number) => Promise<void>,
): Promise<void> {
	await mapLimit(items, limit, iteratee);
}

export async function filterLimit<T>(
	items: T[],
	limit: number,
	predicate: (item: T, index: number) => Promise<boolean>,
): Promise<T[]> {
	const results = await mapLimit(items, limit, predicate);
	return items.filter((_, i) => results[i]);
}

export function pLimit(limit: number) {
	let activeCount = 0;
	const queue: (() => void)[] = [];
	const next = () => {
		activeCount--;
		if (queue.length > 0) {
			queue.shift()!();
		}
	};
	const run = async <T>(
		fn: () => Promise<T>,
		resolve: (v: T) => void,
		reject: (e: any) => void,
	) => {
		activeCount++;
		try {
			const result = await fn();
			resolve(result);
		} catch (err) {
			reject(err);
		} finally {
			next();
		}
	};
	return function <T>(fn: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			if (activeCount < limit) {
				run(fn, resolve, reject);
			} else {
				queue.push(() => run(fn, resolve, reject));
			}
		});
	};
}
