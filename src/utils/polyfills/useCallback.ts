/**
 * A custom implementation of `useCallback` similar to React's `useCallback` hook.
 * It returns a memoized version of the callback function that only changes if one of the `dependencies` has changed.
 *
 * @param fn The function to memoize.
 * @param dependencies An array of dependencies. The function will be re-memoized if any dependency changes.
 * @returns A memoized function.
 */
function useCallback<T extends (...args: any[]) => any>(fn: T, dependencies: any[]): T {
	if (!Array.isArray(dependencies)) {
		throw new Error('dependencies must be an array');
	}

	if (typeof fn !== 'function') {
		throw new Error('First Param should be a function');
	}

	let memoizedFn: T | null = null;
	let previousDependencies: any[] | null = null;

	return function (this: any, ...args: Parameters<T>): ReturnType<T> {
		if (
			previousDependencies === null ||
			!shallowEqual(dependencies, previousDependencies)
		) {
			memoizedFn = fn;
			previousDependencies = dependencies;
		}
		return memoizedFn!.apply(this, args); // Use non-null assertion as memoizedFn is guaranteed to be set
	} as T; // Cast to T to maintain the original function signature
}

/**
 * Performs a shallow comparison between two arrays.
 * @param arr1 The first array.
 * @param arr2 The second array.
 * @returns True if the arrays are shallowly equal, false otherwise.
 */
function shallowEqual(arr1: any[], arr2: any[]): boolean {
	if (arr1 === arr2) return true;
	if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false;
	}
	return true;
}
