import { shallowEqual } from '../ArrayUtils';

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

	return function (...args: Parameters<T>): ReturnType<T> {
		if (
			previousDependencies === null ||
			!shallowEqual(dependencies, previousDependencies)
		) {
			memoizedFn = fn;
			previousDependencies = dependencies;
		}
		return memoizedFn!.apply(this, args);
	} as T;
}
