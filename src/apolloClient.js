import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
	uri: 'http://localhost:3100/graphql',
});

export const client = new ApolloClient({
	link: httpLink,
	cache: new InMemoryCache(),
});

/*
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = new HttpLink({ uri: 'http://localhost:3100/graphql/' });

const wsLink = new WebSocketLink({
    uri: 'ws://localhost:3100/graphql',
    options: {
        reconnect: false,
    },
});

const link = split(
	(param) => {
		const { kind, operation } = getMainDefinition(param?.query);
		return kind === 'OperationDefinition' && ['subscription', 'query'].includes(operation);
	},
	wsLink,
	httpLink
);

export const client = new ApolloClient({
	link,
	cache: new InMemoryCache(),
});
*/
