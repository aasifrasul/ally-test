import { useState, useCallback, useRef, useMemo } from 'react';

import { useAsyncState } from './useAsyncState';

import { executeQuery } from '../client';

import { LazyQueryOptions, LazyQueryExecute, LazyQueryResult } from '../types';

export function useLazyQuery<T = any>(
	query: string,
	options: LazyQueryOptions = {},
): [LazyQueryExecute<T>, LazyQueryResult<T>] {
	const [state, actions] = useAsyncState<T>(false);
	const [called, setCalled] = useState(false);

	const { variables, onCompleted, onError, timeout, cache, cacheTTL } = options;

	// Memoize variables to prevent unnecessary re-renders
	const memoizedVariables = useMemo(() => variables, [JSON.stringify(variables)]);

	// Stable reference to callbacks
	const onCompletedRef = useRef(onCompleted);
	const onErrorRef = useRef(onError);

	useEffect(() => {
		onCompletedRef.current = onCompleted;
		onErrorRef.current = onError;
	}, [onCompleted, onError]);

	const execute = useCallback(
		(execOptions?: { variables?: Record<string, any> }) => {
			setCalled(true);

			return actions.handleAsyncOperation(
				() =>
					executeQuery<T>(
						query,
						execOptions?.variables || memoizedVariables,
						timeout || 10000,
						{ cache, cacheTTL },
					),
				{ onSuccess: onCompletedRef.current, onFailure: onErrorRef.current },
			);
		},
		[query, memoizedVariables, timeout, cache, cacheTTL, actions],
	) as LazyQueryExecute<T>;

	return [execute, { ...state, called }];
}
