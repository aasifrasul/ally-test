import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

import { constants } from './constants/';
import { createLogger, LogLevel } from './utils/Logger';

const GRAPHQL_PATH = '/graphql/';

const getWsUrl = (httpUrl: string) => {
	const url = new URL(httpUrl);
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
	return url.toString();
};

export interface ApolloClientConfig {
	httpUrl: string;
	wsUrl: string;
	retryAttempts?: number;
	fetch?: typeof fetch;
}

const resolveRuntimeFetch = (): typeof fetch | undefined => {
	if (typeof globalThis.fetch === 'function') {
		return globalThis.fetch.bind(globalThis) as typeof fetch;
	}

	return undefined;
};

export function createApolloClient(config?: Partial<ApolloClientConfig>): ApolloClient<any> {
	const finalConfig: ApolloClientConfig = {
		httpUrl: `${constants.BASE_URL || 'http://localhost:3000'}${GRAPHQL_PATH}`,
		wsUrl: `${getWsUrl(constants.BASE_URL || 'http://localhost:3000')}${GRAPHQL_PATH}`,
		retryAttempts: 5,
		fetch: resolveRuntimeFetch(),
		...config,
	};

	if (!finalConfig.httpUrl) {
		throw new Error('BASE_URL is not defined');
	}
	if (!finalConfig.fetch) {
		throw new Error('Fetch API is required to create the Apollo client');
	}

	const logger = createLogger('ApolloClient', {
		level: LogLevel.DEBUG,
	});

	const httpLink = new HttpLink({
		uri: finalConfig.httpUrl,
		fetch: finalConfig.fetch,
	});

	const wsLink = new GraphQLWsLink(
		createClient({
			url: finalConfig.wsUrl,
			retryAttempts: finalConfig.retryAttempts,
			connectionParams: async () => ({
				// authToken: getAuthToken(),
			}),
			on: {
				connected: () => logger.debug('WebSocket connected'),
				closed: (event) => logger.warn('WebSocket closed', event),
				error: (error) => logger.error('WebSocket error', error),
			},
		}),
	);

	const isSubscription = ({ query }: any) => {
		const definition = getMainDefinition(query);
		return (
			definition.kind === 'OperationDefinition' &&
			definition.operation === 'subscription'
		);
	};

	const splitLink = split(isSubscription, wsLink, httpLink);

	return new ApolloClient({
		link: splitLink,
		cache: new InMemoryCache(),
	});
}

export const client = (() => {
	try {
		return createApolloClient();
	} catch {
		return undefined;
	}
})() as ApolloClient<any> | undefined;
