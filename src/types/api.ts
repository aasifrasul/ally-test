import { WorkerQueue } from '../workers/WorkerQueue';
import { DataSource, QueryParams } from '../constants/types';

export enum HTTPMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	PATCH = 'PATCH',
	DELETE = 'DELETE',
}
export interface WorkerMessage {
	id: string;
	type: string;
	data: any;
	error?: string;
}

export interface WorkerResponse {
	id: number;
	type: string;
	data?: any;
	error?: string;
}

export interface CustomFetchOptions extends RequestInit {
	nextPage?: number;
	url?: string;
	force?: boolean;
}

export interface FetchOptions<T, U = T> {
	timeout?: number;
	transformResponse?: (data: any) => T;
	transformUpdateResponse?: (data: any) => U;
	onSuccess?: (data: T) => void;
	onError?: (error: Error) => void;
	onUpdateSuccess?: (data: U) => void;
	onUpdateError?: (error: Error) => void;
	// SWR-like options
	staleTime?: number; // ms; 0 means always stale
	refetchOnWindowFocus?: boolean;
	refetchInterval?: number; // ms; 0/undefined disables
	retry?: number; // number of retries for network errors
	retryDelay?: (attempt: number) => number; // backoff function in ms
	// Dependency injection for testing/overrides
	worker?: WorkerQueue;
	transport?: (
		url: string,
		options: RequestInit & { method: HTTPMethod; body?: any },
	) => Promise<any>;
	dataSourceOverride?: DataSource;
	// Local cache update on mutations
	updateCache?: (oldData: T, mutationResult: U) => T;
}

export interface ModifyOptions {
	url?: string;
	method?: HTTPMethod;
	headers?: Record<string, string>;
	queryParams?: QueryParams;
	body?: string;
	skipCacheUpdate?: boolean;
}

export interface FetchResult<T, U = T> {
	fetchData: (options?: CustomFetchOptions) => Promise<void>;
	fetchNextPage: FetchNextPage;
	updateData: (config?: ModifyOptions) => Promise<U | null>;
	refetch: () => Promise<void>;
	isStale: () => boolean;
}

export type FetchNextPage = (nextPage: number) => Promise<void>;
