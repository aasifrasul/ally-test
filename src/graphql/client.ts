import { createClient, Client, ClientOptions } from 'graphql-http';
import { ExecutionResult } from 'graphql';
import { constants } from '../constants';

export interface SubscribePayload {
	query: string;
}

export const client: Client = createClient({
	url: `${constants.BASE_URL}/graphql/`,
	fetchFn: fetch,
	abortControllerImpl: AbortController, // node < v15
} as ClientOptions);

type SubscriptionPayload<T> = {
	query: T;
};

export const subscribe = async <T extends object>(
	query: string,
): Promise<ExecutionResult<T> | undefined> => {
	let cancel = () => {
		/* abort the request if it is in-flight */
	};

	const result = await new Promise<ExecutionResult<T> | undefined>((resolve, reject) => {
		let result: ExecutionResult<T> | undefined;
		cancel = client.subscribe({ query } as SubscriptionPayload<typeof query>, {
			next: (data: ExecutionResult<T>) => {
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
