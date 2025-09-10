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

	// Store the actions in a ref to avoid recreating callbacks
	const actionsRef = useRef(actions);
	//actionsRef.current = actions;

	// Store callback refs
	const onDataRef = useRef(onSubscriptionData);
	const onErrorRef = useRef(onError);
	const onCompleteRef = useRef(onSubscriptionComplete);

	useEffect(() => {
		onDataRef.current = onSubscriptionData;
		onErrorRef.current = onError;
		onCompleteRef.current = onSubscriptionComplete;
	}, [onSubscriptionData, onError, onSubscriptionComplete]);

	// Create stable callbacks that don't change on every render
	const handleData = useCallback((data: T) => {
		const currentActions = actionsRef.current;
		currentActions.setData(data);
		currentActions.setIsLoading(false);
		currentActions.setError(null);
		onDataRef.current?.({ subscriptionData: { data } });
	}, []); // Empty dependency array - stable callback

	const handleError = useCallback((error: any) => {
		const errorObj = error instanceof Error ? error : new Error('Subscription failed');
		const currentActions = actionsRef.current;
		currentActions.setError(errorObj);
		currentActions.setIsLoading(false);
		onErrorRef.current?.(errorObj);
	}, []); // Empty dependency array - stable callback

	const handleComplete = useCallback(() => {
		const currentActions = actionsRef.current;
		currentActions.setIsLoading(false);
		onCompleteRef.current?.();
	}, []); // Empty dependency array - stable callback

	useEffect(() => {
		const currentActions = actionsRef.current;

		if (skip) {
			currentActions.setIsLoading(false);
			return;
		}

		currentActions.setIsLoading(true);
		currentActions.setError(null);
		currentActions.setData(null);

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
	}, [subscription, variables, skip, handleData, handleError, handleComplete]);

	return state;
}
