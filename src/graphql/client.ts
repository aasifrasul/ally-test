import { createClient, Client, ClientOptions } from 'graphql-http';
import { createClient as createWSClient } from 'graphql-ws';
import { ExecutionResult } from 'graphql';
import { constants } from '../constants';

const BASE_URL = constants.BASE_URL;

// HTTP client for queries and mutations
export const client: Client = createClient({
	url: `${BASE_URL}/graphql/`,
	fetchFn: fetch,
	abortControllerImpl: AbortController,
} as ClientOptions);

// WebSocket client for subscriptions
const wsClient = createWSClient({
	url: `${BASE_URL!.replace('http', 'ws')}/graphql/`,
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
					// You might want to emit events or use callbacks
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

// Better approach: Event-based subscription
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

// Helper function for executing queries and mutations using the HTTP client
export const executeQuery = async <T = any>(query: string, variables?: any): Promise<T> => {
	return new Promise((resolve, reject) => {
		let result: ExecutionResult<T>;

		const cancel = client.subscribe(
			{ query, variables },
			{
				next: (data) => (result = data),
				error: reject,
				complete: () => {
					if (result.errors) {
						reject(new Error(result.errors.map((e) => e.message).join(', ')));
					} else {
						resolve(result.data);
					}
				},
			},
		);

		// Optional: return cancel function if you need to abort
		// You can modify this function to return both result and cancel if needed
	});
};

/**
 * Usage examples:
 *
 * // Query/Mutation (HTTP) - Using the helper function
 * const result = await executeQuery('{ users { id name age } }');
 *
 * // Query/Mutation (HTTP) - Using client.subscribe directly (as per official docs)
 * const result = await new Promise((resolve, reject) => {
 *   let result;
 *   const cancel = client.subscribe(
 *     { query: '{ users { id name age } }' },
 *     {
 *       next: (data) => (result = data),
 *       error: reject,
 *       complete: () => resolve(result),
 *     }
 *   );
 * });
 *
 * // Subscription (WebSocket) - Promise-based
 * const subscription = await subscribe('subscription { userCreated { id name } }');
 * // Later: subscription.unsubscribe();
 *
 * // Subscription (WebSocket) - Callback-based (Recommended)
 * const unsubscribe = subscribeWithCallback(
 *   'subscription { userCreated { id name } }',
 *   {
 *     onData: (data) => console.log('New user:', data),
 *     onError: (error) => console.error('Subscription error:', error)
 *   }
 * );
 * // Later: unsubscribe();
 */
