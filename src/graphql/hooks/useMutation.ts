import { useCallback } from 'react';

import { useAsyncState } from './useAsyncState';

import { executeMutation } from '../client';

import { MutationHookOptions, MutationExecute, MutationResult } from '../types';

export function useMutation<T = any>(
	mutation: string,
	options: MutationHookOptions<T> = {},
): [MutationExecute<T>, MutationResult<T>] {
	const [state, actions] = useAsyncState<T>(false);

	const execute = useCallback(
		(execOptions?: {
			variables?: Record<string, any>;
			optimisticResponse?: any;
			refetchQueries?: Array<{ query: string; variables?: Record<string, any> }>;
		}) => {
			return actions.handleAsyncOperation(
				() =>
					executeMutation<T>(mutation, {
						...execOptions,
					}),
				{ onSuccess: options.onCompleted, onFailure: options.onError },
			);
		},
		[mutation, options, actions],
	) as MutationExecute<T>;

	return [execute, { ...state, reset: actions.reset }];
}
