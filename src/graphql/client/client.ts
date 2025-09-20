import { constants } from '../../constants';
import { CONFIG } from './config';
import { buildWsUrl } from './utils';
import { HttpGraphQLClient } from './clients/http-client';
import { WebSocketManager } from './clients/websocket-manager';
import { CacheManager } from './clients/cache-manager';
import { createLogger, Logger, LogLevel } from '../../utils/Logger';
import type {
	QueryOptions,
	MutationOptions,
	SubscriptionEventHandler,
	SubscriptionResult,
	OptimisticMutationOptions,
	ConnectionStatus,
	RefetchQuery,
	GraphQLClientOptions,
} from './types';

export class GraphQLClient {
	private httpClient: HttpGraphQLClient;
	private wsManager: WebSocketManager;
	private cacheManager: CacheManager;
	private logger: Logger;
	private options: GraphQLClientOptions;

	constructor(options?: Partial<GraphQLClientOptions>) {
		this.options = {
			httpUrl: `${constants.BASE_URL}/graphql/`,
			wsUrl: buildWsUrl(constants.BASE_URL || ''),
			timeout: CONFIG.DEFAULT_TIMEOUT,
			maxRetries: CONFIG.MAX_RETRIES,
			maxWsRetries: CONFIG.MAX_WS_RETRIES,
			...options,
		};

		this.logger = createLogger('GraphQLClient', { level: LogLevel.DEBUG });
		this.cacheManager = new CacheManager();
		this.httpClient = new HttpGraphQLClient(
			this.options.httpUrl,
			this.cacheManager['cache'],
		);
		this.wsManager = new WebSocketManager(this.options.wsUrl);
	}

	// === QUERIES ===
	async query<T = any>(
		query: string,
		variables?: any,
		options: QueryOptions = {},
	): Promise<T> {
		const finalOptions = {
			timeout: this.options.timeout,
			retries: this.options.maxRetries,
			...options,
		};

		return this.httpClient.executeQuery<T>(
			query,
			variables,
			finalOptions.timeout,
			finalOptions,
		);
	}

	// === MUTATIONS ===
	async mutate<T = any>(mutation: string, options: MutationOptions<T> = {}): Promise<T> {
		const {
			variables = {},
			optimisticResponse,
			onCompleted,
			onError,
			refetchQueries,
			awaitRefetchQueries,
			timeout = this.options.timeout,
		} = options;

		try {
			let result: T;

			if (optimisticResponse) {
				// Use optimistic mutation
				result = await this.executeOptimisticMutation<T>(
					mutation,
					variables,
					optimisticResponse,
					{
						updateQueries: [], // You can extend this based on your needs
						invalidatePatterns: [],
					},
					timeout,
				);
			} else {
				// Regular mutation
				result = await this.httpClient.executeQuery<T>(mutation, variables, timeout, {
					cache: false,
				});
			}

			onCompleted?.(result);

			// Handle refetch queries
			if (refetchQueries) {
				const refetchPromises = refetchQueries.map(
					({ query, variables: refetchVars }) => this.query(query, refetchVars),
				);

				if (awaitRefetchQueries) {
					await Promise.all(refetchPromises);
				} else {
					Promise.all(refetchPromises).catch(this.logger.error);
				}
			}

			return result;
		} catch (err) {
			const errorObj = err instanceof Error ? err : new Error('Mutation failed');
			onError?.(errorObj);
			throw errorObj;
		}
	}

	// === OPTIMISTIC MUTATIONS ===
	async executeOptimisticMutation<T = any>(
		mutation: string,
		variables: any,
		optimisticResponse: any,
		options: OptimisticMutationOptions = {},
		timeout: number = CONFIG.DEFAULT_TIMEOUT,
	): Promise<T> {
		const { updateQueries = [], invalidatePatterns = [] } = options;

		try {
			// Apply optimistic updates immediately
			updateQueries.forEach(({ query, variables: queryVars, updater }) => {
				this.cacheManager.updateCache(query, queryVars, (cached) => {
					return updater({ ...cached, ...optimisticResponse });
				});
			});

			// Execute the actual mutation
			const result = await this.httpClient.executeQuery<T>(
				mutation,
				variables,
				timeout,
				{ cache: false },
			);

			// Update cache with real results
			updateQueries.forEach(({ query, variables: queryVars, updater }) => {
				this.cacheManager.updateCache(query, queryVars, updater);
			});

			return result;
		} catch (error) {
			// Rollback optimistic updates on error
			invalidatePatterns.forEach((pattern) => {
				this.cacheManager.invalidate(pattern);
			});

			throw error;
		}
	}

	// === SUBSCRIPTIONS ===
	async subscribe<T = any>(query: string): Promise<SubscriptionResult<T>> {
		return this.wsManager.subscribe<T>(query);
	}

	subscribeWithCallback<T = any>(
		query: string,
		handlers: SubscriptionEventHandler<T>,
		variables?: Record<string, any>,
	) {
		return this.wsManager.subscribeWithCallback(query, handlers, variables);
	}

	// === CACHE UTILITIES ===
	invalidateCache(pattern?: string): void {
		this.cacheManager.invalidate(pattern);
	}

	updateCache(query: string, variables: any, updater: (data: any) => any): void {
		this.cacheManager.updateCache(query, variables, updater);
	}

	clearCache(): void {
		this.cacheManager.clear();
	}

	// === HEALTH & STATUS ===
	async checkHealth(): Promise<boolean> {
		return this.httpClient.checkHealth();
	}

	getConnectionStatus(): ConnectionStatus {
		const wsStatus = this.wsManager.getConnectionStatus();
		return {
			http: true, // HTTP is always available if we can make requests
			websocket: wsStatus.websocket,
			retryAttempts: wsStatus.retryAttempts,
		};
	}

	// === CLEANUP ===
	dispose(): void {
		this.wsManager.dispose();
		this.cacheManager.clear();
		this.logger.info('GraphQL client disposed');
	}
}
