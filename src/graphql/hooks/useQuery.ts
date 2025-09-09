import { useEffect, useCallback, useRef } from 'react';

import { useAsyncState } from './useAsyncState';

import { executeQuery } from '../client';

import { QueryOptions, QueryResult } from '../types';

export function useQuery<T = any>(query: string, options: QueryOptions = {}): QueryResult<T> {
	const {
		variables,
		skip = false,
		cache = true,
		cacheTTL,
		timeout = 5000,
		pollInterval,
		onCompleted,
		onError,
	} = options;

	const [state, actions] = useAsyncState<T>(!skip);
	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const mountedRef = useRef(true);

	const executeQueryInternal = useCallback(
		(vars?: Record<string, any>) => {
			return actions.handleAsyncOperation(
				() =>
					executeQuery<T>(query, vars || variables, timeout, {
						cache,
						cacheTTL,
					}),
				{ onSuccess: onCompleted, onFailure: onError },
			);
		},
		[query, variables, timeout, cache, cacheTTL, onCompleted, onError, actions],
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
