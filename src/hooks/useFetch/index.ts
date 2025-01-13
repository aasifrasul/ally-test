import { useCallback, useEffect, useRef } from 'react';

import { WorkerManager } from '../../workers/WorkerManager';
import { useSelector } from '../useSelector';
import { createActionHooks } from '../createActionHooks';

import { buildQueryParams, handleAsyncCalls } from '../../utils/common';
import { constants } from '../../constants';
import { DataSource, InitialState, QueryParams, Schema } from '../../constants/types';
import { HTTPMethod } from '../../types/api';
import { type FetchNextPage } from '../../types';

interface customFetchOptions extends RequestInit {
	nextPage?: number;
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

export interface UpdateConfig {
	method?: HTTPMethod;
	headers?: Record<string, string>;
	queryParams?: QueryParams;
}

export interface FetchResult<T, U = T> {
	cleanUpTopLevel: () => void;
	getList: (schema?: Schema) => InitialState;
	fetchData: (options?: customFetchOptions) => Promise<void>;
	fetchNextPage: FetchNextPage;
	updateData: (data: Partial<T>, config?: UpdateConfig) => Promise<U | null>;
}

const DEFAULT_TIMEOUT = 2000;

const workerManager = WorkerManager.getInstance();
const messageQueue = workerManager.initializeMessageQueue();

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
		if (timeoutId.current) {
			clearTimeout(timeoutId.current);
			timeoutId.current = null;
		}
	}, []);

	const fetchData = useCallback(
		async (fetchOptions: customFetchOptions = {}): Promise<void> => {
			if (!BASE_URL || !schema) {
				const error = new Error('Missing required parameters: BASE_URL or schema');
				onError?.(error);
				return;
			}

			const { advancePage } = usePageActions();
			const { fetchStarted, fetchSucceeded, fetchFailed, fetchCompleted } =
				useFetchActions();

			cleanUpTopLevel();
			fetchStarted();
			const newQueryParams = {
				...queryParams,
				page: fetchOptions.nextPage || queryParams?.page,
			};

			delete fetchOptions.nextPage;

			const url = `${BASE_URL}?${buildQueryParams(newQueryParams)}`;

			const cleanUp = () => {
				cleanUpTopLevel();
				//abortFetchRequest(url);
			};

			timeoutId.current = setTimeout(() => {
				cleanUp();
				const timeoutError = new Error('Request timeout');
				onError?.(timeoutError);
			}, timeout);

			const enhancedOptions: RequestInit = {
				headers: {
					'Content-Type': 'application/json',
				},
				...fetchOptions,
			};

			const result = await handleAsyncCalls(
				messageQueue.fetchAPIData(url, {
					...enhancedOptions,
					method: HTTPMethod.GET,
				}),
			);

			if (!result.success) {
				if (result.error.name !== 'AbortError') {
					fetchFailed();
					onError(result.error);
				}
			} else {
				const transformedData = transformResponse(result.data);

				fetchSucceeded(transformedData);
				onSuccess(transformedData);

				if (newQueryParams.page) {
					advancePage(newQueryParams.page);
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
		async (data: Partial<T>, config: UpdateConfig = {}): Promise<U | null> => {
			const {
				method = HTTPMethod.POST,
				headers = {},
				queryParams: updateQueryParams = {},
			} = config;

			if (!BASE_URL || !schema) {
				const error = new Error('Missing required parameters: BASE_URL or schema');
				onUpdateError?.(error);
				return null;
			}

			const { updateStarted, updateSucceeded, updateFailed, updateCompleted } =
				useUpdateActions();

			cleanUpTopLevel();
			updateStarted();

			const mergedQueryParams = {
				...queryParams,
				...updateQueryParams,
			};

			const url = `${BASE_URL}?${buildQueryParams(mergedQueryParams)}`;

			const cleanUp = () => {
				cleanUpTopLevel();
				//abortFetchRequest(url);
			};

			timeoutId.current = setTimeout(() => {
				cleanUp();
				const timeoutError = new Error('Update request timeout');

				onUpdateError?.(timeoutError);
			}, timeout);

			const enhancedOptions: RequestInit = {
				headers: {
					'Content-Type': 'application/json',
					...headers,
				},
				body: JSON.stringify(data),
			};

			try {
				const rawData = await messageQueue.fetchAPIData(url, {
					...enhancedOptions,
					method,
				});
				const transformedData = transformUpdateResponse(rawData);

				updateSucceeded();
				onUpdateSuccess(transformedData);
			} catch (error: any) {
				if (error.name !== 'AbortError') {
					const errorObj = error instanceof Error ? error : new Error(String(error));

					updateFailed();
					onUpdateError(errorObj);
				}
			} finally {
				if (timeoutId.current) {
					clearTimeout(timeoutId.current);
					timeoutId.current = null;
				}
				updateCompleted();
			}
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
			fetchData,
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
