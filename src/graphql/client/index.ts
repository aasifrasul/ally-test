import { GraphQLClient } from './client';
import {
	ConnectionStatus,
	MutationOptions,
	OptimisticMutationOptions,
	QueryOptions,
	SubscriptionEventHandler,
	SubscriptionResult,
} from './types';

// Create default client instance
export const client = new GraphQLClient();

// Export the client class for custom instances
export { GraphQLClient };

// Export all types for external use
export type {
	QueryOptions,
	MutationOptions,
	SubscriptionResult,
	SubscriptionEventHandler,
	OptimisticMutationOptions,
	ConnectionStatus,
	GraphQLClientOptions,
	RefetchQuery,
	ExecutionResult,
} from './types';

// Export error classes
export {
	GraphQLTimeoutError,
	GraphQLNetworkError,
	GraphQLValidationError,
	GraphQLSubscriptionError,
	GraphQLConnectionError,
} from './errors';

// Export configuration for advanced users
export { CONFIG } from './config';

// === CONVENIENCE FUNCTIONS ===
// These maintain backward compatibility with your original API

export const executeQuery = <T = any>(
	query: string,
	variables?: any,
	timeoutMs?: number,
	options: QueryOptions = {},
): Promise<T> => {
	return client.query<T>(query, variables, {
		...options,
		timeout: timeoutMs || options.timeout,
	});
};

export const executeMutation = <T = any>(
	mutation: string,
	options: MutationOptions<T> = {},
): Promise<T> => {
	return client.mutate<T>(mutation, options);
};

export const subscribe = <T = any>(query: string): Promise<SubscriptionResult<T>> => {
	return client.subscribe<T>(query);
};

export const subscribeWithCallback = <T = any>(
	query: string,
	handlers: SubscriptionEventHandler<T>,
	variables?: Record<string, any>,
): (() => void) => {
	return client.subscribeWithCallback(query, handlers, variables);
};

export const executeOptimisticMutation = <T = any>(
	mutation: string,
	variables: any,
	optimisticResponse: any,
	options: OptimisticMutationOptions = {},
	timeout?: number,
): Promise<T> => {
	return client.executeOptimisticMutation<T>(
		mutation,
		variables,
		optimisticResponse,
		options,
		timeout,
	);
};

export const invalidateCache = (pattern?: string): void => {
	client.invalidateCache(pattern);
};

export const updateCache = (
	query: string,
	variables: any,
	updater: (data: any) => any,
): void => {
	client.updateCache(query, variables, updater);
};

export const checkGraphQLHealth = (): Promise<boolean> => {
	return client.checkHealth();
};

export const getConnectionStatus = (): ConnectionStatus => {
	return client.getConnectionStatus();
};

// === LEGACY EXPORTS ===
// For complete backward compatibility
export { client as default };

// Re-export original function names
export {
	executeQuery as default_executeQuery,
	executeMutation as default_executeMutation,
	subscribe as default_subscribe,
	subscribeWithCallback as default_subscribeWithCallback,
	executeOptimisticMutation as default_executeOptimisticMutation,
	invalidateCache as default_invalidateCache,
	updateCache as default_updateCache,
	checkGraphQLHealth as default_checkGraphQLHealth,
	getConnectionStatus as default_getConnectionStatus,
};
