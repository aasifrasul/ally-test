import { useRef } from 'react';

type AnyFunction = (...args: any[]) => any;

/**
 * Creates a persistent callback that maintains a stable reference while
 * always executing the latest version of the provided callback
 * @template T Extends AnyFunction - The type of callback function
 * @param callback The callback function to persist
 * @returns A stable function reference that calls the latest callback
 */
export function usePersistentCallback<T extends AnyFunction>(callback: T): T {
	// Store the callback in a mutable ref
	const callbackRef = useRef<T>(callback);

	// Update the ref to latest callback
	callbackRef.current = callback;

	// Create a stable function that delegates to the current callback
	const persistentCallback = useRef<T>(((...args: Parameters<T>) => {
		return callbackRef.current(...args);
	}) as T);

	return persistentCallback.current;
}
