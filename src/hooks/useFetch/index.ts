import { useCallback, useEffect, useRef } from 'react';
import { useDocumentEventListener, useWindowEventListener } from '../';

import { WorkerQueue } from '../../workers/WorkerQueue';
import { createActionHooks } from '../createActionHooks';
import { getList } from '../dataSelector';

import { buildQueryParams, Result, withTimeout } from '../../utils/common';
import { constants } from '../../constants';
import { DataSource, Schema, SchemaToResponse } from '../../constants/types';
import {
	FetchNextPage,
	FetchOptions,
	FetchResult,
	CustomFetchOptions,
	ModifyOptions,
	HTTPMethod,
} from '../../types/api';

// Stable module-level defaults to avoid changing dependencies per render
const DEFAULT_TRANSFORM = (data: any) => data;
const DEFAULT_ON_SUCCESS = () => {};
const DEFAULT_ON_ERROR = () => {};
const DEFAULT_RETRY_DELAY = (attempt: number) => Math.min(1000 * 2 ** (attempt - 1), 30000);
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

export function useFetch<S extends Schema, T = SchemaToResponse[S], U = T>(
	schema: S,
	options: FetchOptions<T, U> = {},
): FetchResult<T, U> {
	// Destructure with stable defaults to prevent recreation
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
		retryDelay = DEFAULT_RETRY_DELAY,
		worker: injectedWorker,
		transport: injectedTransport,
		dataSourceOverride,
		updateCache,
	} = options;

	const { useFetchActions, useUpdateActions, usePageActions } = createActionHooks(schema);

	// Cache stable values to avoid recreating functions
	const dataSource: DataSource | undefined =
		dataSourceOverride ?? constants.dataSources?.[schema];
	const { BASE_URL, queryParams } = dataSource ?? {};

	const worker = injectedWorker ?? workerManager;
	const transport =
		injectedTransport ??
		((url: string, reqOptions: RequestInit & { method: HTTPMethod; body?: any }) =>
			worker.fetchAPIData(url, reqOptions));

	// Get current data for cache updates
	const { data: currentData } = getList(schema);

	// Use refs for mutable values to avoid dependency issues
	const retryRef = useRef<number>(0);
	const isMountedRef = useRef<boolean>(false);

	// CRITICAL: Stable stale checker with useCallback and proper dependencies
	const isStale = useCallback((): boolean => {
		if (!staleTime) return true;
		const meta = schemaMeta.get(schema);
		if (!meta?.lastFetchedAt) return true;
		return Date.now() - meta.lastFetchedAt > staleTime;
	}, [staleTime, schema]); // Only stable values as deps

	// Core fetch logic - optimized to reduce recreations
	const fetchData = useCallback(
		async (fetchOptions: CustomFetchOptions = {}): Promise<void> => {
			const endpoint = fetchOptions.url || BASE_URL;
			if (!endpoint || !schema) {
				const error = new Error('Missing required parameters: endpoint or schema');
				onError(error);
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

			// Clean up fetch options
			const cleanOptions = { ...fetchOptions };
			delete cleanOptions.nextPage;
			delete (cleanOptions as any).force;

			const url = `${endpoint}?${buildQueryParams(enhancedQueryParams)}`;
			const enhancedOptions: RequestInit = {
				headers: {
					'Content-Type': 'application/json',
					...dataSource?.headers,
				},
				...cleanOptions,
			};

			const isRunning = worker.isAPIAlreadyRunning(url, {
				...enhancedOptions,
				method: HTTPMethod.GET,
			});

			if (isRunning) return;

			fetchStarted();

			// Retry logic with proper error handling
			const attemptFetch = async (attemptNum = 0): Promise<void> => {
				const result: Result<T> = await withTimeout(
					transport(url, {
						...enhancedOptions,
						method: HTTPMethod.GET,
					}) as Promise<any>,
					timeout,
				);

				if (result.success) {
					const transformedData = transformResponse(result.data);
					fetchSucceeded(transformedData);
					onSuccess(transformedData);
					retryRef.current = 0;
					schemaMeta.set(schema, { lastFetchedAt: Date.now() });

					if (enhancedQueryParams.page) {
						advancePage(enhancedQueryParams.page);
					}
					fetchCompleted();
				} else {
					if (retry > 0 && attemptNum < retry) {
						retryRef.current = attemptNum + 1;
						const delay = retryDelay(attemptNum + 1);
						await new Promise((resolve) => setTimeout(resolve, delay));
						return attemptFetch(attemptNum + 1);
					}

					// Final failure
					handleError(result.error as Error, fetchFailed, onError);
					throw result.error;
				}
			};

			await attemptFetch();
		},
		[
			BASE_URL,
			schema,
			queryParams,
			dataSource?.headers,
			timeout,
			transformResponse,
			onSuccess,
			onError,
			retry,
			retryDelay,
			worker,
			transport,
			isStale, // Include isStale in dependencies
		],
	);

	// Simplified update logic
	const updateData = useCallback(
		async (config: ModifyOptions = {}): Promise<U | null> => {
			const {
				method = HTTPMethod.POST,
				headers = {},
				queryParams: updateQueryParams = {},
				body = '',
				skipCacheUpdate = false,
			} = config;

			if (!BASE_URL || !schema) {
				const error = new Error('Missing required parameters: BASE_URL or schema');
				onUpdateError(error);
				return null;
			}

			const { updateStarted, updateSucceeded, updateFailed, updateCompleted } =
				useUpdateActions();

			updateStarted();

			const mergedQueryParams = { ...queryParams, ...updateQueryParams };
			const url = `${config.url || BASE_URL}?${buildQueryParams(mergedQueryParams)}`;

			const enhancedOptions: RequestInit = {
				headers: {
					'Content-Type': 'application/json',
					...dataSource?.headers,
					...headers,
				},
				method,
				body,
			};

			const result: Result<U> = await withTimeout(
				transport(url, enhancedOptions as any) as Promise<any>,
				timeout,
			);

			if (result.success) {
				const transformedData = transformUpdateResponse(result.data);
				updateSucceeded();
				onUpdateSuccess(transformedData);

				// Update local cache if configured
				if (updateCache && !skipCacheUpdate && currentData) {
					const updatedData = updateCache(currentData as T, transformedData);
					const { fetchSucceeded } = useFetchActions();
					fetchSucceeded(updatedData);
				}

				// Invalidate cache to ensure fresh data on next fetch
				schemaMeta.delete(schema);
				updateCompleted();

				return transformedData;
			} else {
				handleError(result.error as Error, updateFailed, onUpdateError);
				return null;
			}
		},
		[
			BASE_URL,
			schema,
			queryParams,
			dataSource?.headers,
			timeout,
			transformUpdateResponse,
			onUpdateSuccess,
			onUpdateError,
			updateCache,
			currentData,
			worker,
			transport,
		],
	);

	// Stable event handlers using refs to avoid recreating on every render
	const fetchDataRef = useRef(fetchData);
	const updateDataRef = useRef(updateData);
	const isStaleRef = useRef(isStale);

	const fetchNextPage = useCallback(async (nextPage: number): Promise<void> => {
		await fetchDataRef.current({ nextPage, force: true });
	}, []) as FetchNextPage;

	const refetch = useCallback(async (): Promise<void> => {
		await fetchDataRef.current({ force: true });
	}, []);

	// Use shared event listener hooks for focus and visibility changes
	useWindowEventListener(
		'focus',
		(_: WindowEventMap['focus']) => {
			if (!refetchOnWindowFocus) return;
			if (typeof document !== 'undefined' && document.visibilityState === 'hidden')
				return;
			if (isStaleRef.current()) {
				fetchDataRef.current({ force: true });
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
			if (isStaleRef.current()) {
				fetchDataRef.current({ force: true });
			}
		},
		undefined,
		{ suppressErrors: true },
	);

	// Polling with stable dependencies
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
				if (isStaleRef.current()) {
					fetchDataRef.current({});
				}
			}, refetchInterval);
		}

		return () => {
			isMountedRef.current = false;
			if (typeof window !== 'undefined' && intervalId) {
				window.clearInterval(intervalId);
			}
		};
	}, [refetchInterval]); // Only stable config values

	return {
		fetchData: fetchDataRef.current,
		fetchNextPage,
		updateData: updateDataRef.current,
		refetch,
		isStale: isStaleRef.current,
	} as FetchResult<T, U>;
}
