import { useCallback, useMemo, useRef } from 'react';

import { WorkerQueue } from '../../workers/WorkerQueue';
import { createActionHooks } from '../createActionHooks';
import { useSchema } from '../dataSelector';

import { constants } from '../../constants';
import { DataSource, Schema } from '../../constants/types';
import {
	FetchNextPage,
	FetchOptions,
	FetchResult,
	CustomFetchOptions,
	ModifyOptions,
	HTTPMethod,
} from '../../types/api';
import { handleError, requestWithRetry } from './helpers';
import { invalidateSchema, isSchemaStale, markSchemaFetched } from './cacheMetadata';
import { buildFetchRequest } from './fetchRequest';
import { buildMutationRequest, normalizeMutationOptions } from './mutationRequest';
import { useRefetchLifecycle } from './useRefetchLifecycle';

const DEFAULT_RETRY_DELAY = (attempt: number) => Math.min(1000 * 2 ** (attempt - 1), 30000);
const DEFAULT_TIMEOUT = 2000;

const workerManager = WorkerQueue.getInstance();

export function useFetch<T = unknown, U = T>(
	schema: Schema,
	options: FetchOptions<T, U> = {},
): FetchResult<T, U> {
	const {
		timeout = DEFAULT_TIMEOUT,
		transformResponse = (data: any) => data as T,
		transformUpdateResponse = (data: any) => data as U,
		onSuccess = () => {},
		onError = () => {},
		onUpdateSuccess = () => {},
		onUpdateError = () => {},
		staleTime = 0,
		refetchOnWindowFocus = false,
		refetchInterval,
		retry = 0,
		retryDelay = DEFAULT_RETRY_DELAY,
		worker: injectedWorker,
		transport: injectedTransport,
		dataSourceOverride,
		updateCache,
	} = options;

	const { useFetchActions, useUpdateActions, usePageActions } = createActionHooks(schema);
	const dataSource: DataSource | undefined =
		dataSourceOverride ?? constants.dataSources?.[schema];
	const { BASE_URL, queryParams } = dataSource ?? {};
	const worker = injectedWorker ?? workerManager;
	const transport =
		injectedTransport ??
		((url: string, reqOptions: RequestInit & { method: HTTPMethod; body?: any }) =>
			worker.fetchAPIData(url, reqOptions));
	const { data: currentData } = useSchema(schema);
	const { fetchStarted, fetchSucceeded, fetchFailed, fetchCompleted } = useFetchActions();
	const { updateStarted, updateSucceeded, updateFailed, updateCompleted } =
		useUpdateActions();
	const { advancePage } = usePageActions();

	const isStale = useCallback((): boolean => {
		return isSchemaStale(schema, staleTime);
	}, [staleTime, schema]);

	const fetchData = useCallback(
		async (fetchOptions: CustomFetchOptions = {}): Promise<void> => {
			const endpoint = fetchOptions.url || BASE_URL;
			if (!endpoint || !schema) {
				const error = new Error('Missing required parameters: endpoint or schema');
				onError(error);
				return;
			}

			const shouldForce = Boolean(fetchOptions.force);
			if (!shouldForce && !fetchOptions.nextPage && !isStale()) {
				// Debug: log why fetch is skipped
				// eslint-disable-next-line no-console
				console.debug(
					`useFetch(${schema}): skipping fetch (not stale and not forced)`,
				);
				return;
			}

			const { url, requestOptions } = buildFetchRequest(
				endpoint,
				dataSource,
				queryParams,
				fetchOptions,
			);

			if (worker.isAPIAlreadyRunning(url, requestOptions)) return;

			// Debug: indicate fetch start
			// eslint-disable-next-line no-console
			console.debug(`useFetch(${schema}): starting fetch for url=${url}`);
			fetchStarted();

			try {
				const result = await requestWithRetry<T>(
					transport,
					url,
					requestOptions,
					timeout,
					{ retry, retryDelay },
				);

				if (!result.success) {
					handleError(result.error, fetchFailed, onError);
					return;
				}

				const transformedData = transformResponse(result.data);
				// Debug: log fetch success summary
				// eslint-disable-next-line no-console
				console.debug(
					`useFetch(${schema}): fetch succeeded; transformedData keys=`,
					transformedData && typeof transformedData === 'object'
						? Object.keys(transformedData)
						: transformedData,
				);
				fetchSucceeded(transformedData);
				onSuccess(transformedData);
				markSchemaFetched(schema);

				if (fetchOptions.nextPage || queryParams?.page) {
					advancePage(fetchOptions.nextPage || queryParams?.page);
				}
				fetchCompleted();
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));
				handleError(err, fetchFailed, onError);
			}
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
			isStale,
		],
	);

	const updateData = useCallback(
		async (
			payloadOrConfig: ModifyOptions | Record<string, unknown> = {},
			config: ModifyOptions = {},
		): Promise<U | null> => {
			const normalizedConfig = normalizeMutationOptions(payloadOrConfig, config);
			const { skipCacheUpdate = false } = normalizedConfig;

			if (!BASE_URL || !schema) {
				const error = new Error('Missing required parameters: BASE_URL or schema');
				onUpdateError(error);
				return null;
			}

			updateStarted();

			const { url, requestOptions } = buildMutationRequest(
				BASE_URL,
				dataSource,
				queryParams,
				normalizedConfig,
			);
			try {
				const result = await requestWithRetry<U>(
					transport,
					url,
					requestOptions,
					timeout,
					{ retry, retryDelay },
				);

				if (result.success) {
					const transformedData = transformUpdateResponse(result.data);
					updateSucceeded();
					onUpdateSuccess(transformedData);

					if (updateCache && !skipCacheUpdate && currentData) {
						const updatedData = updateCache(currentData as T, transformedData);
						fetchSucceeded(updatedData);
					}

					invalidateSchema(schema);
					updateCompleted();
					return transformedData;
				}

				handleError(result.error as Error, updateFailed, onUpdateError);
				return null;
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));
				handleError(err, updateFailed, onUpdateError);
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
			retry,
			retryDelay,
			updateCache,
			currentData,
			worker,
			transport,
		],
	);

	const fetchDataRef = useRef(fetchData);
	const updateDataRef = useRef(updateData);
	fetchDataRef.current = fetchData;
	updateDataRef.current = updateData;

	const fetchNextPage = useCallback(async (nextPage: number): Promise<void> => {
		await fetchDataRef.current({ nextPage, force: true });
	}, []) as FetchNextPage;

	const fetchDataStable = useCallback(
		(fetchOptions: CustomFetchOptions = {}) => fetchDataRef.current(fetchOptions),
		[],
	);
	const updateDataStable = useCallback(
		(
			payloadOrConfig: ModifyOptions | Record<string, unknown> = {},
			config: ModifyOptions = {},
		) => updateDataRef.current(payloadOrConfig, config),
		[],
	);

	const refetch = useCallback(async (): Promise<void> => {
		await fetchDataRef.current({ force: true });
	}, []);

	useRefetchLifecycle({
		enabled: refetchOnWindowFocus,
		interval: refetchInterval,
		isStale: isStale as () => boolean,
		refetch: refetch as () => void,
	});

	return useMemo(
		() => ({
			fetchData: fetchDataStable,
			fetchNextPage,
			updateData: updateDataStable,
			refetch,
			isStale,
		}),
		[fetchDataStable, fetchNextPage, updateDataStable, refetch, isStale],
	) as FetchResult<T, U>;
}

export default useFetch;
export type {
	FetchOptions,
	FetchResult,
	ModifyOptions,
	CustomFetchOptions,
	FetchNextPage,
} from '../../types/api';
