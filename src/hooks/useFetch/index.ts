import { useCallback, useEffect, useRef } from 'react';
import { useDocumentEventListener, useWindowEventListener } from '../';

import { WorkerQueue } from '../../workers/WorkerQueue';
import { createActionHooks } from '../createActionHooks';
import { getList } from '../dataSelector';

import { buildQueryParams, Result, withTimeout } from '../../utils/common';
import { constants } from '../../constants';
import { DataSource, QueryParams, Schema, SchemaToResponse } from '../../constants/types';
import { HTTPMethod } from '../../types/api';
import { type FetchNextPage } from '../../types';

// Stable module-level defaults to avoid changing dependencies per render
const DEFAULT_TRANSFORM = (data: any) => data;
const DEFAULT_ON_SUCCESS = (_data: any) => {};
const DEFAULT_ON_ERROR = (_err: any) => {};

interface customFetchOptions extends RequestInit {
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
	// Optional: skip cache update even if updateCache is configured
	skipCacheUpdate?: boolean;
}

export interface FetchResult<T, U = T> {
	fetchData: (options?: customFetchOptions) => Promise<void>;
	fetchNextPage: FetchNextPage;
	updateData: (config?: ModifyOptions) => Promise<U | null>;
}

const DEFAULT_TIMEOUT = 2000;

// Keep lightweight per-schema metadata for SWR behaviors
const schemaMeta = new Map<Schema, { lastFetchedAt?: number }>();

const workerManager = WorkerQueue.getInstance();

function handleError(error: Error, fail: () => void, cb?: (err: Error) => void) {
	if (error.name !== 'AbortError') {
		fail();
		cb?.(error);
	}
}

function useFetch<S extends Schema, T = SchemaToResponse[S], U = T>(
	schema: S,
	options: FetchOptions<T, U> = {},
): FetchResult<T, U> {
	const { useFetchActions, useUpdateActions, usePageActions } = createActionHooks(schema);

	const {
		timeout = DEFAULT_TIMEOUT,
		transformResponse = DEFAULT_TRANSFORM as (d: any) => T,
		transformUpdateResponse = DEFAULT_TRANSFORM as (d: any) => U,
		onSuccess = DEFAULT_ON_SUCCESS,
		onError = DEFAULT_ON_ERROR,
		onUpdateSuccess = DEFAULT_ON_SUCCESS,
		onUpdateError = DEFAULT_ON_ERROR,
		staleTime = 0,
		refetchOnWindowFocus = true,
		refetchInterval,
		retry = 0,
		retryDelay = (attempt: number) => Math.min(1000 * 2 ** (attempt - 1), 30000),
		worker: injectedWorker,
		transport: injectedTransport,
		dataSourceOverride,
		updateCache,
	} = options;

	const dataSource: DataSource | undefined =
		dataSourceOverride ?? constants.dataSources?.[schema];
	const { BASE_URL, queryParams } = dataSource ?? {};

	const worker = injectedWorker ?? workerManager;
	const transport =
		options.transport ??
		((url: string, reqOptions: RequestInit & { method: HTTPMethod; body?: any }) =>
			worker.fetchAPIData(url, reqOptions));

	// Get current data for cache updates
	const { data: currentData } = getList(schema);

	const retryRef = useRef<number>(0);
	const isMountedRef = useRef<boolean>(false);

	const isStale = (): boolean => {
		if (!staleTime) return true;
		const meta = schemaMeta.get(schema);
		if (!meta?.lastFetchedAt) return true;
		return Date.now() - meta.lastFetchedAt > staleTime;
	};

	const fetchData = useCallback(
		async (fetchOptions: customFetchOptions = {}): Promise<void> => {
			const endpoint = fetchOptions.url || BASE_URL;
			if (!endpoint || !schema) {
				const error = new Error('Missing required parameters: endpoint or schema');
				onError?.(error as any);
				return;
			}

			const { advancePage } = usePageActions();
			const { fetchStarted, fetchSucceeded, fetchFailed, fetchCompleted } =
				useFetchActions();

			// Skip if not forced and cache is fresh
			const shouldForce = Boolean(fetchOptions.force);
			if (!shouldForce && !fetchOptions.nextPage && !isStale()) {
				return;
			}

			const enhancedQueryParams = {
				...queryParams,
				page: fetchOptions.nextPage || queryParams?.page,
			};

			delete fetchOptions.nextPage;
			delete (fetchOptions as any).force;

			const url = `${endpoint}?${buildQueryParams(enhancedQueryParams)}`;

			const enhancedOptions: RequestInit = {
				headers: {
					'Content-Type': 'application/json',
					...dataSource?.headers,
				},
				...fetchOptions,
			};

			const isRunning = worker.isAPIAlreadyRunning(url, {
				...enhancedOptions,
				method: HTTPMethod.GET,
			});

			if (isRunning) return;

			fetchStarted();

			const attemptFetch = async (): Promise<Result<T>> =>
				withTimeout(
					transport(url, {
						...enhancedOptions,
						method: HTTPMethod.GET,
					}) as Promise<any>,
					timeout,
				);

			let result: Result<T> = await attemptFetch();

			if (result.success) {
				const transformedData = transformResponse(result.data);

				fetchSucceeded(transformedData);
				onSuccess(transformedData);
				retryRef.current = 0;
				schemaMeta.set(schema, { lastFetchedAt: Date.now() });

				if (enhancedQueryParams.page) {
					advancePage(enhancedQueryParams.page);
				}
			} else {
				handleError(result.error, fetchFailed, onError as any);
				// Retry with backoff if configured
				if (retry > 0 && retryRef.current < retry) {
					retryRef.current += 1;
					const delay = retryDelay(retryRef.current);
					await new Promise((r) => setTimeout(r, delay));

					result = await attemptFetch();
					if (result.success) {
						const transformedData = transformResponse(result.data);
						fetchSucceeded(transformedData);
						onSuccess(transformedData);
						retryRef.current = 0;
						schemaMeta.set(schema, { lastFetchedAt: Date.now() });
						if (enhancedQueryParams.page) {
							advancePage(enhancedQueryParams.page);
						}
					} else {
						handleError(result.error, fetchFailed, onError as any);
					}
				}
			}

			fetchCompleted();
		},
		[BASE_URL, schema, timeout, transformResponse, onSuccess, onError, staleTime],
	) as (options?: customFetchOptions) => Promise<void>;

	const updateData = useCallback(
		async (config: ModifyOptions = {}): Promise<U | null> => {
			const {
				method = HTTPMethod.POST,
				headers = dataSource?.headers,
				queryParams: updateQueryParams = {},
				body = '',
				skipCacheUpdate = false,
			} = config;

			if (!BASE_URL || !schema) {
				const error = new Error('Missing required parameters: BASE_URL or schema');
				onUpdateError?.(error as any);
				return null;
			}

			const { updateStarted, updateSucceeded, updateFailed, updateCompleted } =
				useUpdateActions();

			updateStarted();

			const mergedQueryParams = {
				...queryParams,
				...updateQueryParams,
			};

			const url = `${config.url || BASE_URL}?${buildQueryParams(mergedQueryParams)}`;

			const enhancedOptions: RequestInit = {
				headers: {
					'Content-Type': 'application/json',
					...dataSource?.headers,
					...headers,
				},
				body,
			};

			const result: Result<T> = await withTimeout(
				transport(url, {
					...enhancedOptions,
					method,
					body,
				}) as Promise<any>,
				timeout,
			);

			if (result.success) {
				const transformedData = transformUpdateResponse(result.data);

				updateSucceeded();
				onUpdateSuccess(transformedData);
				// Update local cache if updater is provided and not skipped
				if (updateCache && !skipCacheUpdate && currentData) {
					const updatedData = updateCache(currentData as T, transformedData);
					// Dispatch a success action with the updated data to update the store
					const { fetchSucceeded } = useFetchActions();
					fetchSucceeded({ data: updatedData });
				}
				return transformedData;
			} else {
				handleError(result.error, updateFailed, onError as any);
			}

			updateCompleted();

			return null;
		},
		[
			BASE_URL,
			schema,
			timeout,
			transformUpdateResponse,
			onUpdateSuccess,
			onUpdateError,
			updateCache,
			currentData,
		],
	) as (config?: ModifyOptions) => Promise<U | null>;

	const fetchNextPage = useCallback(
		async (nextPage: number): Promise<void> => {
			const fetchOptions: customFetchOptions = { nextPage, force: true };
			await fetchData(fetchOptions);
		},
		[fetchData],
	) as FetchNextPage;

	// Use shared event listener hooks for focus and visibility changes
	useWindowEventListener(
		'focus',
		(_: WindowEventMap['focus']) => {
			if (!refetchOnWindowFocus) return;
			if (typeof document !== 'undefined' && document.visibilityState === 'hidden')
				return;
			if (isStale()) {
				fetchData({ force: true });
			}
		},
		undefined,
		{ suppressErrors: true },
	);

	useDocumentEventListener(
		'visibilitychange',
		(_: DocumentEventMap['visibilitychange']) => {
			if (!refetchOnWindowFocus) return;
			if (typeof document !== 'undefined' && document.visibilityState === 'hidden')
				return;
			if (isStale()) {
				fetchData({ force: true });
			}
		},
		undefined,
		{ suppressErrors: true },
	);

	// Background polling
	useEffect(() => {
		isMountedRef.current = true;

		let intervalId: number | undefined;
		if (refetchInterval && refetchInterval > 0 && typeof window !== 'undefined') {
			intervalId = window.setInterval(() => {
				if (
					typeof navigator !== 'undefined' &&
					'onLine' in navigator &&
					!navigator.onLine
				) {
					return;
				}
				if (typeof document !== 'undefined' && document.visibilityState === 'hidden')
					return;
				if (isStale()) {
					fetchData({});
				}
			}, refetchInterval);
		}

		return () => {
			isMountedRef.current = false;
			if (typeof window !== 'undefined' && intervalId) {
				window.clearInterval(intervalId);
			}
		};
	}, [schema, staleTime, refetchInterval, fetchData]);

	return {
		fetchData,
		fetchNextPage,
		updateData,
	};
}

export default useFetch;
