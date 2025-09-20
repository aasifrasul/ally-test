// graphql/types.ts
import { ExecutionResult } from 'graphql';

export interface QueryOptions {
	cache?: boolean;
	cacheTTL?: number;
	timeout?: number;
	retries?: number;
}

export interface MutationOptions<T = any> {
	variables?: Record<string, any>;
	optimisticResponse?: any;
	timeout?: number;
	onCompleted?: (data: T) => void;
	onError?: (error: Error) => void;
	refetchQueries?: Array<{ query: string; variables?: any }>;
	awaitRefetchQueries?: boolean;
}

export interface SubscriptionResult<T = any> {
	data?: T | null;
	unsubscribe: () => void;
}

export interface SubscriptionEventHandler<T = any> {
	onData: (data: T) => void;
	onError: (error: any) => void;
	onComplete?: () => void;
}

export interface OptimisticMutationOptions {
	updateQueries?: Array<{
		query: string;
		variables?: any;
		updater: (data: any) => any;
	}>;
	invalidatePatterns?: string[];
}

export interface ConnectionStatus {
	http: boolean;
	websocket: boolean;
	retryAttempts: number;
}

export interface GraphQLClientOptions {
	httpUrl: string;
	wsUrl: string;
	timeout?: number;
	maxRetries?: number;
	maxWsRetries?: number;
}

export interface SubscriptionTracking {
	isActive: boolean;
	retryCount: number;
	lastRetry: number;
}

export interface RefetchQuery {
	query: string;
	variables?: any;
}

// Re-export from graphql for convenience
export type { ExecutionResult } from 'graphql';
