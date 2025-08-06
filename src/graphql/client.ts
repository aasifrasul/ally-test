import { createClient, Client, ClientOptions, RequestParams } from 'graphql-http';
import { createClient as createWSClient } from 'graphql-ws';
import { ExecutionResult } from 'graphql';

import { GraphQLCache } from './GraphQLCache';
import { constants } from '../constants';

const cache = new GraphQLCache();

// === DEDUPLICATION ===
const pendingQueries = new Map<string, Promise<any>>();

export const client: Client = createClient({
	url: `${constants.BASE_URL}/graphql/`,
	fetchFn: (input: RequestInfo | URL, init?: RequestInit) => {
		return fetch(input, init);
	},
} as ClientOptions);

const wsClient = createWSClient({
	url: `${constants.BASE_URL!.replace('http', 'ws')}/graphql/`,
	connectionParams: {},
});

interface QueryOptions {
	cache?: boolean;
	cacheTTL?: number;
	timeout?: number;
}

export const executeQuery = async <T = any>(
	query: string,
	variables?: any,
	timeoutMs: number = 5000,
	options: QueryOptions = {},
): Promise<T> => {
	const { cache: useCache = true, cacheTTL } = options;
	const cacheKey = `${query}${JSON.stringify(variables)}`;

	// Check cache first (only for queries, not mutations)
	const isMutation = query.trim().toLowerCase().startsWith('mutation');
	if (useCache && !isMutation) {
		const cached = cache.get(query, variables);
		if (cached) {
			return cached;
		}
	}

	if (pendingQueries.has(cacheKey)) {
		return pendingQueries.get(cacheKey)!;
	}

	const queryPromise = new Promise<T>((resolve, reject) => {
		let result: ExecutionResult<Record<string, unknown>, unknown>;
		let timeoutId: NodeJS.Timeout | null = null;

		const cancelSubscription = client.subscribe(
			{ query, variables },
			{
				next: (data) => (result = data),
				error: (error) => {
					cleanup();
					reject(error);
				},
				complete: () => {
					cleanup();
					const { data, errors } = result;

					if (errors) {
						reject(new Error(errors.map((e) => e.message).join(', ')));
					} else {
						// Cache the result (only for queries)
						if (useCache && !isMutation) {
							cache.set(query, variables, data, cacheTTL);
						}

						resolve(data as T);
					}
				},
			},
		);

		const cleanup = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			pendingQueries.delete(cacheKey);
		};

		timeoutId = setTimeout(() => {
			cleanup();
			cancelSubscription();
			reject(new Error('API request timed out after ' + timeoutMs + 'ms'));
		}, timeoutMs);
	});

	pendingQueries.set(cacheKey, queryPromise);
	return queryPromise;
};

export interface SubscriptionResult<T = any> {
	data?: T | null;
	unsubscribe: () => void;
}

export const subscribe = <T = any>(query: string): Promise<SubscriptionResult<T>> => {
	return new Promise((resolve, reject) => {
		let hasResolved = false;

		const unsubscribe = wsClient.subscribe(
			{ query },
			{
				next: ({ data }: ExecutionResult<T>) => {
					if (!hasResolved) {
						hasResolved = true;
						resolve({ data, unsubscribe });
					}
				},
				error: (error) => {
					if (!hasResolved) {
						hasResolved = true;
						reject(error);
					}
				},
				complete: () => {},
			},
		);
	});
};

export interface SubscriptionEventHandler<T = any> {
	onData: (data: T) => void;
	onError: (error: any) => void;
	onComplete?: () => void;
}

export const subscribeWithCallback = <T = any>(
	query: string,
	handlers: SubscriptionEventHandler<T>,
): (() => void) => {
	const unsubscribe = wsClient.subscribe(
		{ query },
		{
			next: ({ data, errors }: ExecutionResult<T>) => {
				if (data) handlers.onData(data);
				if (errors) handlers.onError(errors);
			},
			error: handlers.onError,
			complete: handlers.onComplete || (() => {}),
		},
	);

	return () => unsubscribe();
};

// === CACHE UTILITIES ===
export const invalidateCache = (pattern?: string) => {
	cache.invalidate(pattern);
};

export const updateCache = (query: string, variables: any, updater: (data: any) => any) => {
	cache.updateCache(query, variables, updater);
};

// === OPTIMISTIC MUTATIONS ===
export const executeOptimisticMutation = async <T = any>(
	mutation: string,
	variables: any,
	optimisticResponse: any,
	options: {
		updateQueries?: Array<{ query: string; variables?: any; updater: (data: any) => any }>;
		invalidatePatterns?: string[];
	} = {},
): Promise<T> => {
	const { updateQueries = [], invalidatePatterns = [] } = options;

	try {
		// Apply optimistic updates immediately
		updateQueries.forEach(({ query, variables: queryVars, updater }) => {
			cache.updateCache(query, queryVars, (cached) => {
				return updater({ ...cached, ...optimisticResponse });
			});
		});

		// Execute the actual mutation
		const result = await executeQuery<T>(mutation, variables, 5000, { cache: false });

		// Update cache with real results
		updateQueries.forEach(({ query, variables: queryVars, updater }) => {
			cache.updateCache(query, queryVars, updater);
		});

		return result;
	} catch (error) {
		// Rollback optimistic updates on error
		invalidatePatterns.forEach((pattern) => {
			cache.invalidate(pattern);
		});

		throw error;
	}
};
