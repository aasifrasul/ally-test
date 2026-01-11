import { useCallback, useRef } from 'react';

type AnyFunction = (...args: any[]) => any;

/**
 * Creates a persistent callback that maintains a stable reference while
 * always executing the latest version of the provided callback
 * @template T Extends AnyFunction - The type of callback function
 * @param callback The callback function to persist
 * @returns A stable function reference that calls the latest callback
 */
export function usePersistentCallback<T extends AnyFunction>(callback: T): T {
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	return useCallback(
		((...args: Parameters<T>) => {
			return callbackRef.current!(...args);
		}) as T,
		[callbackRef],
	);
}
