import { createClient, Client, ClientOptions } from 'graphql-http';
import { ExecutionResult } from 'graphql';

export interface SubscribePayload {
	query: string;
}

export const client: Client = createClient({
	url: 'http://localhost:3100/graphql/',
	fetchFn: fetch,
	abortControllerImpl: AbortController, // node < v15
} as ClientOptions);

type SubscriptionPayload<T> = {
	query: T;
};

export const subscribe = async <TData extends object>(
	query: string,
): Promise<ExecutionResult<TData> | undefined> => {
	let cancel = () => {
		/* abort the request if it is in-flight */
	};

	const result = await new Promise<ExecutionResult<TData> | undefined>((resolve, reject) => {
		let result: ExecutionResult<TData> | undefined;
		cancel = client.subscribe({ query } as SubscriptionPayload<typeof query>, {
			next: (data) => {
				result = data;
			},
			error: reject,
			complete: () => resolve(result),
		});
	});

	return result;
};

/**
 * query hello { "query": "{ hello }" }
 * query all users { "query": "{ users {id, name, age} }" }
 * query a single user { "query": "{ users(id: 1) {id, name, age} }" }
 */
