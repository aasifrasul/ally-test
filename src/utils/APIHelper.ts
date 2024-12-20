import { abortFetchRequest, fetchAPIData } from '../workers/WorkerHelper';

import {
	fetchStarted,
	fetchSucceeded,
	fetchCompleted,
	fetchFailed,
	updateStarted,
	updateSucceeded,
	updateFailed,
	updateCompleted,
	advancePage,
} from '../actions';

import { buildQueryParams } from './common';

const TIMEOUT = 2000;

interface QueryParams {
	[key: string]: string | number;
	page?: number;
}

interface Options {
	method?: string;
	cache?: RequestCache;
	headers?: Record<string, string>;
	[key: string]: any;
}

type Schema = string;

export function fetchData(
	schema: Schema,
	endPoint: string,
	queryParams: QueryParams = {},
	options: Options = {},
	timeout?: number,
): () => void {
	fetchStarted(schema);

	const timeoutId = setTimeout(() => cleanUp(), timeout || TIMEOUT);
	const url = `${endPoint}${buildQueryParams(queryParams)}`;

	const abortFetch = () => abortFetchRequest(url);

	const cleanUp = () => {
		clearTimeout(timeoutId);
		abortFetch();
	};

	const enhancedOptions: Options = {
		method: 'GET',
		cache: 'no-cache',
		'Referrer-Policy': 'no-referrer',
		...options,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			...options?.headers,
		},
	};

	const fetchLazy = async () => {
		try {
			const data = await fetchAPIData(url, enhancedOptions);
			fetchSucceeded(schema, data);
			if (queryParams.page) {
				advancePage(schema, queryParams.page);
			}
		} catch (err) {
			fetchFailed(schema);
			console.log(err);
		} finally {
			fetchCompleted(schema);
			cleanUp();
		}
	};

	fetchLazy();

	return cleanUp;
}

export function updateData(
	schema: Schema,
	data: any,
	endPoint: string,
	queryParams: QueryParams = {},
	options: Options = {},
	timeout?: number,
): () => void {
	updateStarted(schema);

	const timeoutId = setTimeout(() => cleanUp(), timeout || TIMEOUT);
	const url = `${endPoint}?${buildQueryParams(queryParams)}`;

	const abortUpdate = () => abortFetchRequest(url);

	const cleanUp = () => {
		clearTimeout(timeoutId);
		abortUpdate();
	};

	const enhancedOptions: Options = {
		method: 'POST',
		cache: 'no-cache',
		'Referrer-Policy': 'no-referrer',
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers,
		},
		body: JSON.stringify(data),
	};

	const updateLazy = async () => {
		try {
			await fetchAPIData(url, enhancedOptions);
			updateSucceeded(schema);
		} catch (err) {
			updateFailed(schema);
			console.log(err);
		} finally {
			updateCompleted(schema);
			cleanUp();
		}
	};

	updateLazy();

	return cleanUp;
}
