import { createClient, Client, ClientOptions } from 'graphql-http';
import { createClient as createWSClient } from 'graphql-ws';
import { ExecutionResult } from 'graphql';

import { GraphQLCache } from './GraphQLCache';
import { constants } from '../constants';

import { createLogger, LogLevel, Logger } from '../utils/Logger';

import { MutationOptions } from './types';

const logger: Logger = createLogger('DisplayUsers', {
	level: LogLevel.DEBUG,
});

const cache = new GraphQLCache();

// === DEDUPLICATION ===
const pendingQueries = new Map<string, Promise<any>>();

export const client: Client = createClient({
	url: `${constants.BASE_URL}/graphql/`,
	fetchFn: (input: RequestInfo | URL, init?: RequestInit) => {
		// Add longer timeout for fetch requests
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

		return fetch(input, {
			...init,
			signal: controller.signal,
		}).finally(() => clearTimeout(timeoutId));
	},
} as ClientOptions);

// Build websocket URL safely with retry logic
const buildWsUrl = (): string => {
	try {
		const base = new URL(String(constants.BASE_URL));
		base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
		base.pathname = '/graphql/';
		base.search = '';
		base.hash = '';
		return base.toString();
	} catch {
		return `${(constants.BASE_URL || '').replace(/^http/, 'ws')}/graphql/`;
	}
};

// WebSocket client with better error handling and reconnection
let wsClient: any = null;
let wsConnectionAttempts = 0;
const MAX_WS_RETRIES = 3;

const createWSConnection = () => {
	if (wsClient) {
		try {
			wsClient.dispose();
		} catch (e) {
			logger.warn('Error disposing WebSocket client:', e);
		}
	}

	wsClient = createWSClient({
		url: buildWsUrl(),
		connectionParams: {},
		retryAttempts: MAX_WS_RETRIES,
		retryWait: async (retries) => {
			wsConnectionAttempts = retries;
			// Exponential backoff: 1s, 2s, 4s
			await new Promise((resolve) =>
				setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 10000)),
			);
		},
		on: {
			connecting: () => {
				logger.info('WebSocket connecting...');
			},
			connected: () => {
				logger.info('WebSocket connected successfully');
				wsConnectionAttempts = 0;
			},
			closed: (event) => {
				logger.info('WebSocket connection closed:', event);
			},
			error: (error) => {
				logger.error('WebSocket error:', error);
			},
		},
	});

	return wsClient;
};

// Initialize WebSocket connection
createWSConnection();

interface QueryOptions {
	cache?: boolean;
	cacheTTL?: number;
	timeout?: number;
	retries?: number;
}

export const executeQuery = async <T = any>(
	query: string,
	variables?: any,
	timeoutMs: number = 30000, // Increased default timeout
	options: QueryOptions = {},
): Promise<T> => {
	const { cache: useCache = true, cacheTTL, retries = 2 } = options;
	const normalizedQuery = query.replace(/\s+/g, ' ').trim();
	const cacheKey = `${normalizedQuery}${JSON.stringify(variables || {})}`;

	// Check cache first (only for queries, not mutations)
	const isMutation = normalizedQuery.toLowerCase().startsWith('mutation');
	if (useCache && !isMutation) {
		const cached = cache.get(normalizedQuery, variables);
		if (cached) {
			return cached;
		}
	}

	// Check for pending identical requests
	if (pendingQueries.has(cacheKey)) {
		return pendingQueries.get(cacheKey)!;
	}

	const executeWithRetry = async (attempt: number = 0): Promise<T> => {
		return new Promise<T>((resolve, reject) => {
			let result: ExecutionResult<Record<string, unknown>, unknown>;
			let timeoutId: NodeJS.Timeout | null = null;
			let isResolved = false;

			const cleanup = () => {
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = null;
				}
				if (!isResolved) {
					pendingQueries.delete(cacheKey);
				}
			};

			const handleError = (error: any) => {
				cleanup();
				if (isResolved) return;
				isResolved = true;

				// Retry logic for network errors
				if (
					attempt < retries &&
					(error.message?.includes('timeout') ||
						error.message?.includes('network') ||
						error.message?.includes('fetch'))
				) {
					logger.warn(`Query attempt ${attempt + 1} failed, retrying...`, error);
					setTimeout(
						() => {
							executeWithRetry(attempt + 1)
								.then(resolve)
								.catch(reject);
						},
						Math.min(1000 * Math.pow(2, attempt), 5000),
					);
				} else {
					reject(error);
				}
			};

			try {
				const cancelSubscription = client.subscribe(
					{ query: normalizedQuery, variables },
					{
						next: (data) => (result = data),
						error: handleError,
						complete: () => {
							cleanup();
							if (isResolved) return;
							isResolved = true;

							const { data, errors } = result;

							if (errors) {
								reject(new Error(errors.map((e) => e.message).join(', ')));
							} else {
								// Cache the result (only for queries)
								if (useCache && !isMutation) {
									cache.set(normalizedQuery, variables, data, cacheTTL);
								}

								resolve(data as T);
							}
						},
					},
				);

				// Set timeout
				timeoutId = setTimeout(() => {
					cleanup();
					if (isResolved) return;
					isResolved = true;

					cancelSubscription();
					handleError(new Error(`GraphQL request timed out after ${timeoutMs}ms`));
				}, timeoutMs);
			} catch (error) {
				handleError(error);
			}
		});
	};

	const queryPromise = executeWithRetry();
	pendingQueries.set(cacheKey, queryPromise);

	try {
		const result = await queryPromise;
		pendingQueries.delete(cacheKey);
		return result;
	} catch (error) {
		pendingQueries.delete(cacheKey);
		throw error;
	}
};

export interface SubscriptionResult<T = any> {
	data?: T | null;
	unsubscribe: () => void;
}

export const subscribe = <T = any>(query: string): Promise<SubscriptionResult<T>> => {
	return new Promise((resolve, reject) => {
		let hasResolved = false;

		// Ensure WebSocket is connected
		if (!wsClient || wsConnectionAttempts >= MAX_WS_RETRIES) {
			createWSConnection();
		}

		const unsubscribe = wsClient.subscribe(
			{ query },
			{
				next: ({ data }: ExecutionResult<T>) => {
					if (!hasResolved) {
						hasResolved = true;
						resolve({ data, unsubscribe });
					}
				},
				error: (error: Error) => {
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

// Track active subscriptions to prevent infinite loops
const activeSubscriptions = new Map<
	string,
	{
		isActive: boolean;
		retryCount: number;
		lastRetry: number;
	}
>();

export const subscribeWithCallback = <T = any>(
	query: string,
	handlers: SubscriptionEventHandler<T>,
	variables?: Record<string, any>,
): (() => void) => {
	const normalizedQuery = query.replace(/\s+/g, ' ').trim();
	const subscriptionKey = `${normalizedQuery}:${JSON.stringify(variables || {})}`;

	// Check if we already have an active subscription for this query
	const existing = activeSubscriptions.get(subscriptionKey);
	if (existing?.isActive) {
		logger.warn('Subscription already active for:', subscriptionKey);
		return () => {}; // Return no-op unsubscribe
	}

	// Initialize subscription tracking
	activeSubscriptions.set(subscriptionKey, {
		isActive: true,
		retryCount: 0,
		lastRetry: 0,
	});

	let isSubscribed = true;
	let unsubscribeFn: (() => void) | null = null;

	const cleanup = () => {
		isSubscribed = false;
		const tracking = activeSubscriptions.get(subscriptionKey);
		if (tracking) {
			tracking.isActive = false;
		}

		if (unsubscribeFn) {
			try {
				unsubscribeFn();
			} catch (error) {
				logger.warn('Error unsubscribing:', error);
			}
			unsubscribeFn = null;
		}
	};

	const attemptSubscription = () => {
		if (!isSubscribed) return;

		const tracking = activeSubscriptions.get(subscriptionKey);
		if (!tracking || !tracking.isActive) return;

		// Ensure WebSocket is connected
		if (!wsClient) {
			logger.info('Creating new WebSocket connection for subscription...');
			createWSConnection();
		}

		try {
			unsubscribeFn = wsClient.subscribe(
				{ query: normalizedQuery, variables },
				{
					next: ({ data, errors }: ExecutionResult<T>) => {
						if (!isSubscribed) return;

						// Reset retry count on successful data
						const tracking = activeSubscriptions.get(subscriptionKey);
						if (tracking) {
							tracking.retryCount = 0;
						}

						if (data) handlers.onData(data);
						if (errors) handlers.onError(errors);
					},
					error: (error: Error) => {
						if (!isSubscribed) return;

						logger.error('Subscription error:', error);

						const tracking = activeSubscriptions.get(subscriptionKey);
						if (!tracking) return;

						tracking.retryCount++;
						const now = Date.now();

						// Prevent infinite retries - max 3 retries with exponential backoff
						if (tracking.retryCount <= 3 && now - tracking.lastRetry > 5000) {
							tracking.lastRetry = now;
							const delay = Math.min(
								1000 * Math.pow(2, tracking.retryCount - 1),
								10000,
							);

							logger.info(
								`WebSocket error detected, attempting reconnect ${tracking.retryCount}/3 in ${delay}ms`,
							);

							setTimeout(() => {
								if (isSubscribed && tracking.isActive) {
									createWSConnection();
									setTimeout(() => {
										if (isSubscribed && tracking.isActive) {
											attemptSubscription();
										}
									}, 1000);
								}
							}, delay);
						} else {
							logger.error(
								'Max subscription retries exceeded or too frequent retries',
							);
							cleanup();
						}

						handlers.onError(error);
					},
					complete: () => {
						if (!isSubscribed) return;
						logger.info('Subscription completed');
						cleanup();
						handlers.onComplete?.();
					},
				},
			);
		} catch (error) {
			logger.error('Error creating subscription:', error);
			handlers.onError(error);
			cleanup();
		}
	};

	// Start the subscription
	attemptSubscription();

	// Return cleanup function
	return cleanup;
};

// === CACHE UTILITIES ===
export const invalidateCache = (pattern?: string) => {
	cache.invalidate(pattern);
};

export const updateCache = (query: string, variables: any, updater: (data: any) => any) => {
	cache.updateCache(query, variables, updater);
};

// Direct mutation function for use in event handlers
export async function executeMutation<T = any>(
	mutation: string,
	options: {
		variables?: Record<string, any>;
		optimisticResponse?: any;
		timeout?: number;
	} & MutationOptions<T> = {},
): Promise<T> {
	const {
		variables = {},
		optimisticResponse,
		onCompleted,
		onError,
		refetchQueries,
		awaitRefetchQueries,
		timeout = 30000, // Increased default timeout for mutations
	} = options;

	try {
		let result: T;

		if (optimisticResponse) {
			// Use optimistic mutation
			result = await executeOptimisticMutation<T>(
				mutation,
				variables,
				optimisticResponse,
				{
					updateQueries: [], // You can extend this based on your needs
					invalidatePatterns: [],
				},
				timeout,
			);
		} else {
			// Regular mutation
			result = await executeQuery<T>(mutation, variables, timeout, { cache: false });
		}

		onCompleted?.(result);

		// Handle refetch queries
		if (refetchQueries) {
			const refetchPromises = refetchQueries.map(({ query, variables: refetchVars }) =>
				executeQuery(query, refetchVars, timeout),
			);

			if (awaitRefetchQueries) {
				await Promise.all(refetchPromises);
			} else {
				Promise.all(refetchPromises).catch(logger.error);
			}
		}

		return result;
	} catch (err) {
		const errorObj = err instanceof Error ? err : new Error('Mutation failed');
		onError?.(errorObj);
		throw errorObj;
	}
}

// === OPTIMISTIC MUTATIONS ===
export const executeOptimisticMutation = async <T = any>(
	mutation: string,
	variables: any,
	optimisticResponse: any,
	options: {
		updateQueries?: Array<{ query: string; variables?: any; updater: (data: any) => any }>;
		invalidatePatterns?: string[];
	} = {},
	timeout: number = 30000,
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
		const result = await executeQuery<T>(mutation, variables, timeout, { cache: false });

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

// Health check function
export const checkGraphQLHealth = async (): Promise<boolean> => {
	try {
		const healthQuery = `query { __schema { types { name } } }`;
		await executeQuery(healthQuery, {}, 5000, { cache: false });
		return true;
	} catch (error) {
		logger.error('GraphQL health check failed:', error);
		return false;
	}
};

// Connection status
export const getConnectionStatus = () => {
	return {
		http: true, // HTTP is always available if we can make requests
		websocket: wsClient?.getState?.() === 1 || false, // 1 = OPEN
		retryAttempts: wsConnectionAttempts,
	};
};
