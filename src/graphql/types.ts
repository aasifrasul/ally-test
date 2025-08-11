// Define the handler types to match your client
export interface SubscriptionEventHandler<T = any> {
	onData: (data: T) => void;
	onError: (error: any) => void;
	onComplete?: () => void;
}

// ===== COMMON TYPES =====

export interface BaseResult {
	isLoading: boolean;
	error: Error | null;
}

export interface NetworkStatus {
	isLoading: boolean;
	error: Error | null;
	called?: boolean;
}

// ===== useQuery Hook =====

export interface QueryOptions {
	variables?: Record<string, any>;
	skip?: boolean;
	cache?: boolean;
	cacheTTL?: number;
	timeout?: number;
	pollInterval?: number;
	onCompleted?: (data: any) => void;
	onError?: (error: Error) => void;
}

type ReFetchFunc<T> = (variables?: Record<string, any> | undefined) => Promise<T>;

export interface QueryResult<T> extends BaseResult {
	data: T | null;
	refetch: ReFetchFunc<T>;
	startPolling: (pollInterval: number) => void;
	stopPolling: () => void;
	updateQuery: (updater: (prev: T | null) => T | null) => void;
}

export interface SubscriptionOptions<T> {
	variables?: Record<string, any>;
	skip?: boolean;
	onSubscriptionData?: (options: { subscriptionData: { data: T } }) => void;
	onSubscriptionComplete?: () => void;
	onError?: (error: Error) => void;
}

export interface SubscriptionResult<T> extends BaseResult {
	data: T | null;
}

export interface LazyQueryOptions extends Omit<QueryOptions, 'skip'> {}

export interface LazyQueryResult<T> extends BaseResult {
	data: T | null;
	called: boolean;
}

export type LazyQueryExecute<T> = (options?: {
	variables?: Record<string, any>;
}) => Promise<T | null>;

export interface MutationOptions<T> {
	onCompleted?: (data: T) => void;
	onError?: (error: Error) => void;
	optimisticResponse?: any;
	refetchQueries?: Array<{
		query: string;
		variables?: Record<string, any>;
	}>;
	awaitRefetchQueries?: boolean;
}

export interface MutationHookOptions<T> {
	onCompleted?: (data: T) => void;
	onError?: (error: Error) => void;
}

export interface MutationResult<T> extends BaseResult {
	data: T | null;
	reset: () => void;
}

export type MutationExecute<T> = (options?: {
	variables?: Record<string, any>;
	optimisticResponse?: any;
	refetchQueries?: Array<{
		query: string;
		variables?: Record<string, any>;
	}>;
}) => Promise<T>;
