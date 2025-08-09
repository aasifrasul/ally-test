import { useCallback, useEffect, useRef } from 'react';

import { WorkerQueue } from '../../workers/WorkerQueue';
import { useSelector } from '../useSelector';
import { createActionHooks } from '../createActionHooks';

import { buildQueryParams, Result } from '../../utils/common';
import { constants } from '../../constants';
import { DataSource, InitialState, QueryParams, Schema } from '../../constants/types';
import { HTTPMethod } from '../../types/api';
import { type FetchNextPage } from '../../types';

interface customFetchOptions extends RequestInit {
	nextPage?: number;
	url?: string;
}

export interface FetchOptions<T, U = T> {
	timeout?: number;
	transformResponse?: (data: any) => T;
	transformUpdateResponse?: (data: any) => U;
	onSuccess?: (data: T) => void;
	onError?: (error: Error) => void;
	onUpdateSuccess?: (data: U) => void;
	onUpdateError?: (error: Error) => void;
}

export interface ModifyOptions {
	url?: string;
	method?: HTTPMethod;
	headers?: Record<string, string>;
	queryParams?: QueryParams;
	body?: string;
}

export interface FetchResult<T, U = T> {
	cleanUpTopLevel: () => void;
	getList: (schema?: Schema) => InitialState;
	fetchData: (options?: customFetchOptions) => Promise<void>;
	fetchNextPage: FetchNextPage;
	updateData: (config?: ModifyOptions) => Promise<U | null>;
}

const DEFAULT_TIMEOUT = 2000;

const workerManager = WorkerQueue.getInstance();

function useFetch<T, U = T>(
	schema: Schema,
	options: FetchOptions<T, U> = {},
): FetchResult<T, U> {
	const { useFetchActions, useUpdateActions, usePageActions } = createActionHooks(schema);

	const {
		timeout = DEFAULT_TIMEOUT,
		transformResponse = (data: any) => data as T,
		transformUpdateResponse = (data: any) => data as U,
		onSuccess = (data: any) => data,
		onError = (error: any) => error,
		onUpdateSuccess = (data: any) => data,
		onUpdateError = (error: any) => error,
	} = options;

	const timeoutId = useRef<NodeJS.Timeout | null>(null);
	const dataSource: DataSource | undefined = constants.dataSources?.[schema];
	const { BASE_URL, queryParams } = dataSource ?? {};

	const cleanUpTopLevel = useCallback(() => {
		// Clear timeout
		if (timeoutId.current) {
			clearTimeout(timeoutId.current);
			timeoutId.current = null;
		}
	}, []);

	const fetchData = useCallback(
		async (fetchOptions: customFetchOptions = {}): Promise<void> => {
			const endpoint = fetchOptions.url || BASE_URL;
			if (!endpoint || !schema) {
				const error = new Error('Missing required parameters: endpoint or schema');
				onError?.(error);
				return;
			}

			// Cleanup any previous request
			cleanUpTopLevel();

			const { advancePage } = usePageActions();
			const { fetchStarted, fetchSucceeded, fetchFailed, fetchCompleted } =
				useFetchActions();

			const enhancedQueryParams = {
				...queryParams,
				page: fetchOptions.nextPage || queryParams?.page,
			};

			delete fetchOptions.nextPage;

			const url = `${endpoint}?${buildQueryParams(enhancedQueryParams)}`;

			const enhancedOptions: RequestInit = {
				headers: {
					'Content-Type': 'application/json',
					...dataSource?.headers,
				},
				...fetchOptions,
			};

			const isRunning = workerManager.isAPIAlreadyRunning(url, {
				...enhancedOptions,
				method: HTTPMethod.GET,
			});

			if (isRunning) return;

			fetchStarted();

			// Set up timeout that will abort the request
			timeoutId.current = setTimeout(() => {
				const timeoutError = new Error('Request timeout');
				fetchFailed();
				onError?.(timeoutError);
				fetchCompleted();
			}, timeout);

			const result: Result<T> = await workerManager.fetchAPIData(url, {
				...enhancedOptions,
				method: HTTPMethod.GET,
			});

			if (result.success) {
				const transformedData = transformResponse(result.data);

				fetchSucceeded(transformedData);
				onSuccess(transformedData);

				if (enhancedQueryParams.page) {
					advancePage(enhancedQueryParams.page);
				}
			} else {
				if (result.error.name !== 'AbortError') {
					fetchFailed();
					onError(result.error);
				}

				// Only treat as error if it wasn't an intentional abort
				if (result.error instanceof Error && result.error.name !== 'AbortError') {
					fetchFailed();
					onError(result.error);
				}
			}

			if (timeoutId.current) {
				clearTimeout(timeoutId.current);
				timeoutId.current = null;
			}

			fetchCompleted();
		},
		[BASE_URL, schema, timeout, cleanUpTopLevel, transformResponse, onSuccess, onError],
	);

	const updateData = useCallback(
		async (config: ModifyOptions = {}): Promise<U | null> => {
			const {
				method = HTTPMethod.POST,
				headers = dataSource?.headers,
				queryParams: updateQueryParams = {},
				body = '',
			} = config;

			if (!BASE_URL || !schema) {
				const error = new Error('Missing required parameters: BASE_URL or schema');
				onUpdateError?.(error);
				return null;
			}

			// Cleanup any previous request
			cleanUpTopLevel();

			const { updateStarted, updateSucceeded, updateFailed, updateCompleted } =
				useUpdateActions();

			updateStarted();

			const mergedQueryParams = {
				...queryParams,
				...updateQueryParams,
			};

			const url = `${config.url || BASE_URL}?${buildQueryParams(mergedQueryParams)}`;

			// Set up timeout
			timeoutId.current = setTimeout(() => {
				const timeoutError = new Error('Update request timeout');
				updateFailed();
				onUpdateError?.(timeoutError);
				updateCompleted();
			}, timeout);

			const enhancedOptions: RequestInit = {
				headers: {
					'Content-Type': 'application/json',
					...dataSource?.headers,
					...headers,
				},
				body,
			};

			const result: Result<T> = await workerManager.fetchAPIData(url, {
				...enhancedOptions,
				method,
				body,
			});

			if (result.success) {
				const transformedData = transformUpdateResponse(result.data);

				updateSucceeded();
				onUpdateSuccess(transformedData);
				return transformedData;
			} else {
				if (result.error.name !== 'AbortError') {
					updateFailed();
					onUpdateError(result.error);
				}

				if (result.error instanceof Error && result.error.name !== 'AbortError') {
					updateFailed();
					onUpdateError(result.error);
				}
			}

			if (timeoutId.current) {
				clearTimeout(timeoutId.current);
				timeoutId.current = null;
			}
			updateCompleted();

			return null;
		},
		[
			BASE_URL,
			schema,
			timeout,
			cleanUpTopLevel,
			transformUpdateResponse,
			onUpdateSuccess,
			onUpdateError,
		],
	);

	const fetchNextPage = useCallback(
		async (nextPage: number): Promise<void> => {
			const fetchOptions: customFetchOptions = { nextPage };
			await fetchData(fetchOptions);
		},
		[fetchData],
	);

	function getList(schemaOverride: Schema = schema): InitialState {
		return useSelector((store) => store[schemaOverride]);
	}

	useEffect(() => {
		return () => cleanUpTopLevel();
	}, [cleanUpTopLevel]);

	return {
		cleanUpTopLevel,
		getList,
		fetchData,
		fetchNextPage,
		updateData,
	};
}

export default useFetch;
