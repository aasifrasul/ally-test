import { createClient, Client, ClientOptions, RequestParams } from 'graphql-http';
import { createClient as createWSClient } from 'graphql-ws';
import { ExecutionResult } from 'graphql';
import { constants } from '../constants';

// Define a custom RequestParams type that includes the signal
// This is an internal type for your helper function, not modifying graphql-http's type
interface CustomRequestParams extends RequestParams {
	signal?: AbortSignal;
}

// HTTP client for queries and mutations
// The fetchFn will be a wrapper that intercepts the AbortSignal
export const client: Client = createClient({
	url: `${constants.BASE_URL}/graphql/`,
	fetchFn: (input: RequestInfo | URL, init?: RequestInit) => {
		return fetch(input, init);
	},
	// No need for abortControllerImpl here for per-request abortion
} as ClientOptions); // Cast to ClientOptions if needed, though usually inferred

// WebSocket client for subscriptions
const wsClient = createWSClient({
	url: `${constants.BASE_URL!.replace('http', 'ws')}/graphql/`,
	connectionParams: {
		// Add auth if needed
	},
});

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
				next: (data: ExecutionResult<T>) => {
					if (!hasResolved) {
						hasResolved = true;
						resolve({
							data: data.data,
							unsubscribe: () => unsubscribe(),
						});
					}
					// Handle subsequent messages here if needed
				},
				error: (error) => {
					if (!hasResolved) {
						hasResolved = true;
						reject(error);
					}
				},
				complete: () => {
					// Subscription ended
				},
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
			next: (result: ExecutionResult<T>) => {
				if (result.data) {
					handlers.onData(result.data);
				}
				if (result.errors) {
					handlers.onError(result.errors);
				}
			},
			error: handlers.onError,
			complete: handlers.onComplete || (() => {}),
		},
	);

	return () => unsubscribe();
};

// Corrected helper function for queries/mutations with timeout and cancellation
export const executeQuery = async <T = any>(
	query: string,
	variables?: any,
	timeoutMs: number = 5000,
): Promise<T> => {
	return new Promise((resolve, reject) => {
		let result: ExecutionResult<Record<string, unknown>, unknown>;
		let timeoutId: NodeJS.Timeout | null = null;

		// graphql-http's client.subscribe returns a 'cancel' function
		// which internally uses AbortController to stop the HTTP request.
		const cancelSubscription = client.subscribe(
			{ query, variables },
			{
				next: (data) => (result = data),
				error: (error) => {
					cancelTimeout();
					reject(error);
				},
				complete: () => {
					cancelTimeout();

					if (result.errors) {
						reject(new Error(result.errors.map((e) => e.message).join(', ')));
					} else {
						resolve(result.data as T);
					}
				},
			},
		);

		const cancelTimeout = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};

		timeoutId = setTimeout(() => {
			cancelTimeout();

			// Call the cancel function provided by graphql-http
			cancelSubscription();

			reject(new Error('API request timed out after ' + timeoutMs + 'ms'));
		}, timeoutMs);
	});
};

// Alternative version that returns both result and cancel function
export const executeQueryWithCancel = <T = any>(
	query: string,
	variables?: any,
	timeoutMs: number = 5000,
): {
	promise: Promise<T>;
	cancel: () => void;
} => {
	let timeoutId: NodeJS.Timeout | null = null;
	let graphqlCancel: (() => void) | null = null;

	const cancelTimeout = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	const cancel = () => {
		cancelTimeout();
		if (graphqlCancel) {
			graphqlCancel(); // Call the graphql-http unsubscribe/cancel
		}
	};

	const promise = new Promise<T>((resolve, reject) => {
		let result: ExecutionResult<Record<string, unknown>, unknown>;

		graphqlCancel = client.subscribe(
			{ query, variables },
			{
				next: (data) => (result = data),
				error: (error) => {
					cancel(); // Call the outer cancel function on error
					reject(error);
				},
				complete: () => {
					cancelTimeout();

					if (result.errors) {
						reject(new Error(result.errors.map((e) => e.message).join(', ')));
					} else {
						resolve(result.data as T);
					}
				},
			},
		);

		if (timeoutMs > 0) {
			timeoutId = setTimeout(() => {
				cancel();
				reject(new Error('API request timed out after ' + timeoutMs + 'ms'));
			}, timeoutMs);
		}
	});

	return { promise, cancel };
};

/**
 * Usage examples:
 *
 * // Query/Mutation with proper timeout and abort
 * try {
 * const result = await executeQuery('{ users { id name age } }', {}, 3000);
 * console.log(result);
 * } catch (error) {
 * console.error('Query failed:', error.message);
 * }
 *
 * // Query/Mutation with manual cancellation
 * const { promise, cancel } = executeQueryWithCancel('{ users { id name age } }');
 *
 * // Cancel after 2 seconds manually
 * setTimeout(() => cancel(), 2000);
 *
 * try {
 * const result = await promise;
 * console.log(result);
 * } catch (error) {
 * console.error('Query was cancelled or failed:', error.message);
 * }
 *
 * // Subscription examples remain the same
 * const unsubscribe = subscribeWithCallback(
 * 'subscription { userCreated { id name } }',
 * {
 * onData: (data) => console.log('New user:', data),
 * onError: (error) => console.error('Subscription error:', error)
 * }
 * );
 */
