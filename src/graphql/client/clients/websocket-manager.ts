import { createClient as createWSClient } from 'graphql-ws';
import { ExecutionResult } from 'graphql';

import { CONFIG } from '../config';
import { GraphQLSubscriptionError } from '../errors';
import { normalizeQuery, generateCacheKey, calculateWsRetryDelay } from '../utils';
import { createLogger, LogLevel, Logger } from '../../../utils/Logger';
import type {
	SubscriptionResult,
	SubscriptionEventHandler,
	SubscriptionTracking,
} from '../types';

export class WebSocketManager {
	private wsClient: any = null;
	private wsConnectionAttempts = 0;
	private logger: Logger;
	private wsUrl: string;
	private activeSubscriptions = new Map<string, SubscriptionTracking>();

	constructor(wsUrl: string) {
		this.wsUrl = wsUrl;
		this.logger = createLogger('WebSocketManager', { level: LogLevel.DEBUG });
		this.createConnection();
	}

	private createConnection() {
		if (this.wsClient) {
			try {
				this.wsClient.dispose();
			} catch (e) {
				this.logger.warn('Error disposing WebSocket client:', e);
			}
		}

		this.wsClient = createWSClient({
			url: this.wsUrl,
			connectionParams: CONFIG.WS_CONNECTION_PARAMS,
			retryAttempts: CONFIG.MAX_WS_RETRIES,
			retryWait: async (retries) => {
				this.wsConnectionAttempts = retries;
				await new Promise((resolve) =>
					setTimeout(resolve, calculateWsRetryDelay(retries)),
				);
			},
			on: {
				connecting: () => {
					this.logger.info('WebSocket connecting...');
				},
				connected: () => {
					this.logger.info('WebSocket connected successfully');
					this.wsConnectionAttempts = 0;
				},
				closed: (event) => {
					this.logger.info('WebSocket connection closed:', event);
				},
				error: (error) => {
					this.logger.error('WebSocket error:', error);
				},
			},
		});
	}

	async subscribe<T = any>(query: string): Promise<SubscriptionResult<T>> {
		return new Promise((resolve, reject) => {
			let hasResolved = false;

			// Ensure WebSocket is connected
			if (!this.wsClient || this.wsConnectionAttempts >= CONFIG.MAX_WS_RETRIES) {
				this.createConnection();
			}

			const unsubscribe = this.wsClient.subscribe(
				{ query },
				{
					next: ({ data }: ExecutionResult<T>) => {
						if (!hasResolved) {
							hasResolved = true;
							resolve({ data, unsubscribe });
						}
					},
					error: (error: Error) => {
						if (!hasResolved) {
							hasResolved = true;
							reject(new GraphQLSubscriptionError(error.message));
						}
					},
					complete: () => {},
				},
			);
		});
	}

	subscribeWithCallback<T = any>(
		query: string,
		handlers: SubscriptionEventHandler<T>,
		variables?: Record<string, any>,
	) {
		const normalizedQuery = normalizeQuery(query);
		const subscriptionKey = generateCacheKey(normalizedQuery, variables);

		// Check if we already have an active subscription for this query
		const existing = this.activeSubscriptions.get(subscriptionKey);
		if (existing?.isActive) {
			this.logger.warn('Subscription already active for:', subscriptionKey);
			return () => {}; // Return no-op unsubscribe
		}

		// Initialize subscription tracking
		this.activeSubscriptions.set(subscriptionKey, {
			isActive: true,
			retryCount: 0,
			lastRetry: 0,
		});

		let isSubscribed = true;
		let unsubscribeFn: (() => void) | null = null;

		const cleanup = () => {
			isSubscribed = false;
			const tracking = this.activeSubscriptions.get(subscriptionKey);
			if (tracking) {
				tracking.isActive = false;
			}

			if (unsubscribeFn) {
				try {
					unsubscribeFn();
				} catch (error) {
					this.logger.warn('Error unsubscribing:', error);
				}
				unsubscribeFn = null;
			}
		};

		const attemptSubscription = () => {
			if (!isSubscribed) return;

			const tracking = this.activeSubscriptions.get(subscriptionKey);
			if (!tracking || !tracking.isActive) return;

			// Ensure WebSocket is connected
			if (!this.wsClient) {
				this.logger.info('Creating new WebSocket connection for subscription...');
				this.createConnection();
			}

			try {
				unsubscribeFn = this.wsClient.subscribe(
					{ query: normalizedQuery, variables },
					{
						next: ({ data, errors }: ExecutionResult<T>) => {
							if (!isSubscribed) return;

							// Reset retry count on successful data
							const tracking = this.activeSubscriptions.get(subscriptionKey);
							if (tracking) {
								tracking.retryCount = 0;
							}

							if (data) handlers.onData(data);
							if (errors) handlers.onError(errors);
						},
						error: (error: Error) => {
							if (!isSubscribed) return;

							this.logger.error('Subscription error:', error);

							const tracking = this.activeSubscriptions.get(subscriptionKey);
							if (!tracking) return;

							tracking.retryCount++;
							const now = Date.now();

							// Prevent infinite retries - max retries with exponential backoff
							if (
								tracking.retryCount <= CONFIG.MAX_SUBSCRIPTION_RETRIES &&
								now - tracking.lastRetry >
									CONFIG.RETRY_DELAYS.MIN_RETRY_INTERVAL
							) {
								tracking.lastRetry = now;
								const delay = calculateWsRetryDelay(tracking.retryCount - 1);

								this.logger.info(
									`WebSocket error detected, attempting reconnect ${tracking.retryCount}/${CONFIG.MAX_SUBSCRIPTION_RETRIES} in ${delay}ms`,
								);

								setTimeout(() => {
									if (isSubscribed && tracking.isActive) {
										this.createConnection();
										setTimeout(() => {
											if (isSubscribed && tracking.isActive) {
												attemptSubscription();
											}
										}, 1000);
									}
								}, delay);
							} else {
								this.logger.error(
									'Max subscription retries exceeded or too frequent retries',
								);
								cleanup();
							}

							handlers.onError(
								new GraphQLSubscriptionError(
									error.message,
									tracking.retryCount,
								),
							);
						},
						complete: () => {
							if (!isSubscribed) return;
							this.logger.info('Subscription completed');
							cleanup();
							handlers.onComplete?.();
						},
					},
				);
			} catch (error) {
				this.logger.error('Error creating subscription:', error);
				handlers.onError(new GraphQLSubscriptionError(String(error)));
				cleanup();
			}
		};

		// Start the subscription
		attemptSubscription();

		// Return cleanup function
		return cleanup;
	}

	getConnectionStatus() {
		return {
			websocket: this.wsClient?.getState?.() === 1 || false, // 1 = OPEN
			retryAttempts: this.wsConnectionAttempts,
		};
	}

	dispose() {
		if (this.wsClient) {
			try {
				this.wsClient.dispose();
			} catch (error) {
				this.logger.warn('Error disposing WebSocket client:', error);
			}
		}
		this.activeSubscriptions.clear();
	}
}
