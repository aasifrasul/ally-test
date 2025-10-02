import { createClient, Client, ClientOptions } from 'graphql-http';
import { ExecutionResult } from 'graphql';

import { GraphQLCache } from '../../GraphQLCache';
import { CONFIG } from '../config';
import { GraphQLTimeoutError, GraphQLValidationError, GraphQLNetworkError } from '../errors';
import {
	normalizeQuery,
	generateCacheKey,
	isMutation,
	calculateRetryDelay,
	isRetryableError,
} from '../utils';
import { requestDeduplicator } from '../utils/deduplication';
import { createLogger, LogLevel, Logger } from '../../../utils/Logger';
import type { QueryOptions } from '../../types';

export class HttpGraphQLClient {
	private client: Client;
	private cache: GraphQLCache;
	private logger: Logger;

	constructor(url: string, cache: GraphQLCache) {
		this.cache = cache;
		this.logger = createLogger('HttpGraphQLClient', { level: LogLevel.DEBUG });

		this.client = createClient({
			url,
			fetchFn: this.createFetchWithTimeout(),
		} as ClientOptions);
	}

	private createFetchWithTimeout() {
		return (input: RequestInfo | URL, init?: RequestInit) => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), CONFIG.DEFAULT_TIMEOUT);

			return fetch(input, {
				...init,
				signal: controller.signal,
			}).finally(() => clearTimeout(timeoutId));
		};
	}

	async executeQuery<T = any>(
		query: string,
		variables?: any,
		timeoutMs: number = CONFIG.DEFAULT_TIMEOUT,
		options: QueryOptions = {},
	): Promise<T> {
		const {
			cache: useCache = CONFIG.DEFAULT_CACHE_ENABLED,
			cacheTTL,
			retries = CONFIG.MAX_RETRIES,
		} = options;
		const normalizedQuery = normalizeQuery(query);
		const cacheKey = generateCacheKey(normalizedQuery, variables);

		// Check cache first (only for queries, not mutations)
		const isQueryMutation = isMutation(normalizedQuery);
		if (useCache && !isQueryMutation) {
			const cached = this.cache.get(normalizedQuery, variables);
			if (cached) return cached;
		}

		// Check for pending identical requests
		if (requestDeduplicator.hasPendingRequest(normalizedQuery, variables)) {
			return requestDeduplicator.getPendingRequest(normalizedQuery, variables)!;
		}

		const executeWithRetry = async (attempt: number = 0): Promise<T> => {
			return new Promise<T>((resolve, reject) => {
				let result: ExecutionResult<Record<string, unknown>, unknown>;
				let timeoutId: NodeJS.Timeout | null = null;
				let isResolved = false;

				const cleanup = () => {
					if (timeoutId) {
						clearTimeout(timeoutId);
						timeoutId = null;
					}
				};

				const handleError = (error: any) => {
					cleanup();
					if (isResolved) return;
					isResolved = true;

					// Retry logic for network errors
					if (attempt < retries && isRetryableError(error)) {
						this.logger.warn(
							`Query attempt ${attempt + 1} failed, retrying...`,
							error,
						);
						setTimeout(() => {
							executeWithRetry(attempt + 1)
								.then(resolve)
								.catch(reject);
						}, calculateRetryDelay(attempt));
					} else {
						const errorToThrow =
							error instanceof Error
								? error
								: new GraphQLNetworkError(String(error));
						reject(errorToThrow);
					}
				};

				try {
					const cancelSubscription = this.client.subscribe(
						{ query: normalizedQuery, variables },
						{
							next: (data) => (result = data),
							error: handleError,
							complete: () => {
								cleanup();
								if (isResolved) return;
								isResolved = true;

								const { data, errors } = result;

								if (errors) {
									reject(
										new GraphQLValidationError(
											errors.map((e) => e.message),
										),
									);
								} else {
									// Cache the result (only for queries)
									if (useCache && !isQueryMutation) {
										this.cache.set(
											normalizedQuery,
											variables,
											data,
											cacheTTL,
										);
									}

									resolve(data as T);
								}
							},
						},
					);

					// Set timeout
					timeoutId = setTimeout(() => {
						cleanup();
						if (isResolved) return;
						isResolved = true;

						cancelSubscription();
						handleError(new GraphQLTimeoutError(timeoutMs));
					}, timeoutMs);
				} catch (error) {
					handleError(error);
				}
			});
		};

		const queryPromise = executeWithRetry();
		requestDeduplicator.addPendingRequest(normalizedQuery, variables, queryPromise);

		return queryPromise;
	}

	async checkHealth(): Promise<boolean> {
		try {
			const healthQuery = `query { __schema { types { name } } }`;
			await this.executeQuery(healthQuery, {}, CONFIG.HEALTH_CHECK_TIMEOUT, {
				cache: false,
			});
			return true;
		} catch (error) {
			this.logger.error('GraphQL health check failed:', error);
			return false;
		}
	}
}
