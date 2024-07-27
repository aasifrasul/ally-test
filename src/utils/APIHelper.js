import { abortFetchRequest, fetchAPIData, loadImages } from '../workers/WorkerHelper';

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

export function fetchData(schema, endPoint, queryParams = {}, options = {}, timeout) {
	fetchStarted(schema);

	const timeoutId = setTimeout(() => cleanUp(), timeout || TIMEOUT);
	const url = `${endPoint}${buildQueryParams(queryParams)}`;

	const abortFetch = () => abortFetchRequest(url);

	const cleanUp = () => {
		clearTimeout(timeoutId);
		abortFetch();
	};

	const enhancedOptions = {
		method: 'GET',
		//mode: 'cors',
		cache: 'no-cache',
		'Referrer-Policy': 'no-referrer',
		//credentials: 'same-origin',
		/**/
		//redirect: 'follow',
		//referrerPolicy: 'strict-origin-when-cross-origin',
		//body: body ? JSON.stringify(data) : {},
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

export function updateData(schema, data, endPoint, queryParams = {}, options = {}, timeout) {
	updateStarted(schema);

	const timeoutId = setTimeout(() => cleanUp(), timeout || TIMEOUT);
	const url = `${endPoint}?${buildQueryParams(queryParams)}`;

	const abortUpdate = () => abortFetchRequest(url);

	const cleanUp = () => {
		clearTimeout(timeoutId);
		abortUpdate();
	};

	const enhancedOptions = {
		method: 'POST',
		//mode: 'cors',
		cache: 'no-cache',
		'Referrer-Policy': 'no-referrer',
		//credentials: 'same-origin',
		/**/
		//redirect: 'follow',
		//body: body ? JSON.stringify(data) : {},
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers,
		},
		body: JSON.stringify(data),
	};

	const updateLazy = async () => {
		try {
			const data = await fetchAPIData(url, enhancedOptions);
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
