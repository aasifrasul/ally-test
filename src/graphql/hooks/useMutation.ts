import { useCallback, useRef } from 'react';

import { useAsyncState } from './useAsyncState';

import { executeMutation } from '../client';

import { MutationHookOptions, MutationExecute, MutationResult } from '../types';

export function useMutation<T = any>(
	mutation: string,
	options: MutationHookOptions<T> = {},
): [MutationExecute<T>, MutationResult<T>] {
	const [state, actions] = useAsyncState<T>(false);

	const { onCompleted, onError } = options;

	// Stable reference to callbacks
	const onCompletedRef = useRef(onCompleted);
	const onErrorRef = useRef(onError);

	useEffect(() => {
		onCompletedRef.current = onCompleted;
		onErrorRef.current = onError;
	}, [onCompleted, onError]);

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
				{ onSuccess: onCompletedRef.current, onFailure: onErrorRef.current },
			);
		},
		[mutation, actions],
	) as MutationExecute<T>;

	return [execute, { ...state, reset: actions.reset }];
}
