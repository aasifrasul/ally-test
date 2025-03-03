import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { constants } from './constants/';

const httpLink = new HttpLink({
	uri: `${constants.BASE_URL}/graphql/`,
});

const wsLink = new GraphQLWsLink(
	createClient({
		url: `${constants.BASE_URL.replace('http', 'ws')}/graphql/`,
		connectionParams: {
			// Add any authentication tokens if needed
			// authToken: user.authToken
		},
		on: {
			connected: () => console.log('WebSocket connected'),
			closed: (event) => console.log('WebSocket closed', event),
			error: (error) => console.error('WebSocket error', error),
		},
	}),
);

const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return (
			definition.kind === 'OperationDefinition' &&
			definition.operation === 'subscription'
		);
	},
	wsLink,
	httpLink,
);

export const client = new ApolloClient({
	link: splitLink,
	cache: new InMemoryCache(),
});
