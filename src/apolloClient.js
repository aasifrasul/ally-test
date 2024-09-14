import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
	uri: 'http://localhost:3100/graphql/',
});

const wsLink = new GraphQLWsLink(
	createClient({
		url: 'ws://localhost:3100/graphql',
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
