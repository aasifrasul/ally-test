import { useState, useEffect, useRef, useCallback } from 'react';
import {
	executeQueryWithCache,
	executeOptimisticMutation,
	invalidateQueries,
} from './client';
import { subscribeWithCallback } from './~client';

interface QueryState<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
}

interface UseQueryOptions {
	cache?: boolean;
	cacheTTL?: number;
	skip?: boolean;
	pollInterval?: number;
	subscription?: string; // Optional subscription for real-time updates
}

// Custom hook for queries with caching and subscriptions
export function useQuery<T = any>(
	query: string,
	variables?: any,
	options: UseQueryOptions = {},
): QueryState<T> & { refetch: () => Promise<void> } {
	const [state, setState] = useState<QueryState<T>>({
		data: null,
		loading: !options.skip,
		error: null,
	});

	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const subscriptionRef = useRef<(() => void) | null>(null);

	const executeQuery = useCallback(async () => {
		if (options.skip) return;

		setState((prev) => ({ ...prev, loading: true, error: null }));

		try {
			const data = await executeQueryWithCache<T>(query, variables, {
				cache: options.cache,
				cacheTTL: options.cacheTTL,
			});
			setState({ data, loading: false, error: null });
		} catch (error) {
			setState({
				data: null,
				loading: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}, [query, JSON.stringify(variables), options.skip, options.cache, options.cacheTTL]);

	// Initial fetch and subscription setup
	useEffect(() => {
		executeQuery();

		// Set up polling if specified
		if (options.pollInterval) {
			pollIntervalRef.current = setInterval(executeQuery, options.pollInterval);
		}

		// Set up subscription if specified
		if (options.subscription) {
			subscriptionRef.current = subscribeWithCallback(options.subscription, {
				onData: (subscriptionData) => {
					// Update state with subscription data
					setState((prev) => ({
						...prev,
						data: { ...prev.data, ...subscriptionData } as T,
					}));
				},
				onError: (error) => {
					console.error('Subscription error:', error);
				},
			});
		}

		// Cleanup
		return () => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
			}
			if (subscriptionRef.current) {
				subscriptionRef.current();
			}
		};
	}, [executeQuery, options.pollInterval, options.subscription]);

	return {
		...state,
		refetch: executeQuery,
	};
}

interface UseMutationOptions {
	optimisticResponse?: any;
	updateQueries?: Array<{
		query: string;
		variables?: any;
		updater: (data: any) => any;
	}>;
	invalidatePatterns?: string[];
	onCompleted?: (data: any) => void;
	onError?: (error: Error) => void;
}

// Custom hook for mutations with optimistic updates
export function useMutation<T = any>(
	mutation: string,
	options: UseMutationOptions = {},
): [
	(variables?: any) => Promise<T>,
	{ loading: boolean; error: string | null; data: T | null },
] {
	const [state, setState] = useState<{
		loading: boolean;
		error: string | null;
		data: T | null;
	}>({
		loading: false,
		error: null,
		data: null,
	});

	const executeMutation = useCallback(
		async (variables?: any): Promise<T> => {
			setState({ loading: true, error: null, data: null });

			try {
				let result: T;

				if (options.optimisticResponse || options.updateQueries) {
					result = await executeOptimisticMutation<T>(
						mutation,
						variables,
						options.optimisticResponse,
						{
							updateQueries: options.updateQueries,
							invalidatePatterns: options.invalidatePatterns,
						},
					);
				} else {
					result = await executeQueryWithCache<T>(mutation, variables, {
						cache: false,
					});
				}

				setState({ loading: false, error: null, data: result });

				// Invalidate cache patterns if specified
				if (options.invalidatePatterns) {
					invalidateQueries(options.invalidatePatterns);
				}

				options.onCompleted?.(result);
				return result;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				setState({ loading: false, error: errorMessage, data: null });
				options.onError?.(error as Error);
				throw error;
			}
		},
		[mutation, options],
	);

	return [executeMutation, state];
}

// Hook for managing subscriptions
export function useSubscription<T = any>(
	subscription: string,
	options: {
		onData: (data: T) => void;
		onError?: (error: any) => void;
		skip?: boolean;
	},
) {
	const { onData, onError, skip } = options;

	useEffect(() => {
		if (skip) return;

		const unsubscribe = subscribeWithCallback<T>(subscription, {
			onData,
			onError: onError || ((error) => console.error('Subscription error:', error)),
		});

		return unsubscribe;
	}, [subscription, skip, onData, onError]);
}
