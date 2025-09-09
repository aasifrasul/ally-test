import { useEffect, useCallback, useRef } from 'react';

import { useAsyncState } from './/useAsyncState';

import { subscribeWithCallback } from '../client';

import { SubscriptionOptions, SubscriptionResult, SubscriptionEventHandler } from '../types';

export function useSubscription<T = any>(
	subscription: string,
	options: SubscriptionOptions<T> = {},
): SubscriptionResult<T> {
	const {
		variables,
		skip = false,
		onSubscriptionData,
		onSubscriptionComplete,
		onError,
	} = options;
	const [state, actions] = useAsyncState<T>(!skip);

	const onDataRef = useRef(onSubscriptionData);
	const onErrorRef = useRef(onError);
	const onCompleteRef = useRef(onSubscriptionComplete);

	useEffect(() => {
		onDataRef.current = onSubscriptionData;
		onErrorRef.current = onError;
		onCompleteRef.current = onSubscriptionComplete;
	}, [onSubscriptionData, onError, onSubscriptionComplete]);

	const handleData = useCallback(
		(data: T) => {
			actions.setData(data);
			actions.setIsLoading(false);
			actions.setError(null);
			onDataRef.current?.({ subscriptionData: { data } });
		},
		[actions],
	);

	const handleError = useCallback(
		(error: any) => {
			const errorObj = error instanceof Error ? error : new Error('Subscription failed');
			actions.setError(errorObj);
			actions.setIsLoading(false);
			onErrorRef.current?.(errorObj);
		},
		[actions],
	);

	const handleComplete = useCallback(() => {
		actions.setIsLoading(false);
		onCompleteRef.current?.();
	}, [actions]);

	useEffect(() => {
		if (skip) {
			actions.setIsLoading(false);
			return;
		}

		actions.setIsLoading(true);
		actions.setError(null);
		actions.setData(null);

		const unsubscribe = subscribeWithCallback<T>(
			subscription,
			{
				onData: handleData,
				onError: handleError,
				onComplete: handleComplete,
			} as SubscriptionEventHandler,
			variables,
		);

		return () => {
			unsubscribe();
		};
	}, [subscription, variables, skip, handleData, handleError, handleComplete, actions]);

	return state;
}
