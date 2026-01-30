import { useEffect, useCallback, useRef, useMemo } from 'react';

import { useAsyncState } from './';

import { executeQuery } from '../client';

import { QueryOptions, QueryResult } from '../types';

export function useQuery<T = any>(query: string, options: QueryOptions = {}): QueryResult<T> {
	const {
		variables,
		skip = false,
		cache = true,
		cacheTTL,
		timeout = 10000,
		pollInterval,
		onCompleted,
		onError,
	} = options;

	const [state, actions] = useAsyncState<T>(!skip);
	const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mountedRef = useRef(true);

	// Memoize variables to prevent unnecessary re-renders
	const memoizedVariables = useMemo(() => variables, [JSON.stringify(variables)]);

	// Stable reference to callbacks
	const onCompletedRef = useRef(onCompleted);
	const onErrorRef = useRef(onError);

	useEffect(() => {
		onCompletedRef.current = onCompleted;
		onErrorRef.current = onError;
	}, [onCompleted, onError]);

	const executeQueryInternal = useCallback(
		(vars?: Record<string, any>) => {
			return actions.handleAsyncOperation(
				() =>
					executeQuery<T>(query, vars || memoizedVariables, timeout, {
						cache,
						cacheTTL,
					}),
				{
					onSuccess: onCompletedRef.current,
					onFailure: onErrorRef.current,
				},
			);
		},
		[query, memoizedVariables, timeout, cache, cacheTTL, actions],
	);

	const refetch = useCallback(
		(newVariables?: Record<string, any>) => executeQueryInternal(newVariables),
		[executeQueryInternal],
	);

	const startPolling = useCallback(
		(interval: number): void => {
			if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

			pollIntervalRef.current = setInterval(() => {
				executeQueryInternal();
			}, interval);
		},
		[executeQueryInternal],
	);

	const stopPolling = useCallback((): void => {
		if (pollIntervalRef.current) {
			clearInterval(pollIntervalRef.current);
			pollIntervalRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!skip) executeQueryInternal();
	}, [executeQueryInternal, skip]);

	useEffect(() => {
		if (pollInterval && !skip) startPolling(pollInterval);
		return () => stopPolling();
	}, [pollInterval, skip, startPolling, stopPolling]);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			stopPolling();
		};
	}, [stopPolling]);

	return {
		...state,
		refetch,
		startPolling,
		stopPolling,
		updateQuery: actions.updateData,
	} as QueryResult<T>;
}
