import { useState, useCallback } from 'react';

import { useAsyncState } from './useAsyncState';

import { executeQuery } from '../client';

import { LazyQueryOptions, LazyQueryExecute, LazyQueryResult } from '../types';

export function useLazyQuery<T = any>(
	query: string,
	options: LazyQueryOptions = {},
): [LazyQueryExecute<T>, LazyQueryResult<T>] {
	const [state, actions] = useAsyncState<T>(false);
	const [called, setCalled] = useState(false);

	const execute = useCallback(
		(execOptions?: { variables?: Record<string, any> }) => {
			setCalled(true);

			return actions.handleAsyncOperation(
				() =>
					executeQuery<T>(
						query,
						execOptions?.variables || options.variables,
						options.timeout || 5000,
						{ cache: options.cache, cacheTTL: options.cacheTTL },
					),
				{ onSuccess: options.onCompleted, onFailure: options.onError },
			);
		},
		[query, options, actions],
	) as LazyQueryExecute<T>;

	return [execute, { ...state, called }];
}
