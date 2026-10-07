import { GraphQLClient } from '../client';
import { createGraphQLClient } from '../factory';

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
});
