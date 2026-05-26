import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { constants } from './constants/';
import { createLogger, Logger, LogLevel } from './utils/Logger';

const logger: Logger = createLogger('ApolloClient', {
	level: LogLevel.DEBUG,
});
const GRAPHQL_PATH = '/graphql/';

if (!constants.BASE_URL) {
	throw new Error('BASE_URL is not defined');
}

const getWsUrl = (httpUrl: string) => {
	const url = new URL(httpUrl);
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
	return url.toString();
};

const httpLink = new HttpLink({
	uri: `${constants.BASE_URL}${GRAPHQL_PATH}`,
});

const wsLink = new GraphQLWsLink(
	createClient({
		url: `${getWsUrl(constants.BASE_URL)}${GRAPHQL_PATH}`,
		retryAttempts: 5,
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
		definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
	);
};

const splitLink = split(isSubscription, wsLink, httpLink);

export const client = new ApolloClient({
	link: splitLink,
	cache: new InMemoryCache(),
});
