import { constants } from '../../constants';

import { GraphQLClient } from './client';
import { CONFIG } from './config';
import type { GraphQLClientOptions } from './types';
import { buildWsUrl } from './utils';

export function createGraphQLClient(options?: Partial<GraphQLClientOptions>): GraphQLClient {
	const finalOptions: GraphQLClientOptions = {
		httpUrl: `${constants.BASE_URL}/graphql/`,
		wsUrl: buildWsUrl(constants.BASE_URL || ''),
		timeout: CONFIG.DEFAULT_TIMEOUT,
		maxRetries: CONFIG.MAX_RETRIES,
		maxWsRetries: CONFIG.MAX_WS_RETRIES,
		...options,
	};

	return new GraphQLClient(finalOptions);
}
