import { ApolloClient } from '@apollo/client';

import { GraphQLClient } from '../client';
import { createGraphQLClient } from '../factory';
import { createApolloClient } from '../../../ApolloClient';

describe('createGraphQLClient', () => {
	it('builds a client from explicit runtime config without the global singleton assumptions', () => {
		const client = createGraphQLClient({
			httpUrl: 'https://example.com/graphql',
			wsUrl: 'wss://example.com/graphql-ws',
			timeout: 5000,
			maxRetries: 4,
			maxWsRetries: 6,
		});

		expect(client).toBeInstanceOf(GraphQLClient);
		expect((client as any).options.httpUrl).toBe('https://example.com/graphql');
		expect((client as any).options.wsUrl).toBe('wss://example.com/graphql-ws');
		expect((client as any).options.timeout).toBe(5000);
		expect((client as any).options.maxRetries).toBe(4);
	});

	it('builds an Apollo client from explicit runtime config without a hidden singleton', () => {
		const client = createApolloClient({
			httpUrl: 'https://example.com/graphql',
			wsUrl: 'wss://example.com/graphql-ws',
			fetch: jest.fn(),
		});

		expect(client).toBeInstanceOf(ApolloClient);
		expect((client as any).link).toBeDefined();
	});
});
