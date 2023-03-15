import React, { useState, useEffect, useMemo } from 'react';

import { useFetchStore, useFetchDispatch } from '../Context/dataFetchContext';
import { safelyExecuteFunction } from '../utils/typeChecking';
import WebWorker from '../workers/WebWorkerHelper';
import MyWorker from '../workers/MyWorker';

// Worker initialisation
const worker = new WebWorker(MyWorker);

const controller = new AbortController();
//const worker = new Worker(new URL('apiWorker.js', window.location.origin));

const useFetch = (schema, initialUrl, initialParams = {}, successCallback, failureCallback, skip = false) => {
	const [url, updateUrl] = useState(initialUrl);
	const [params, updateParams] = useState(initialParams);
	const [errorMessage, setErrorMessage] = useState('');
	const [refetchIndex, setRefetchIndex] = useState(0);
	const queryString = Object.keys(params)
		.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
		.join('&');

	const state = useFetchStore();
	const dispatch = useFetchDispatch();

	const refetch = () => setRefetchIndex((previousIndex) => previousIndex + 1);
	const updateQueryParams = (queryParams) =>
		updateParams((previousParams) => {
			console.log({ ...previousParams, ...queryParams });
			return { ...previousParams, ...queryParams };
		});
	const abortFetching = () => {
		console.log('Now aborting');
		// Abort.
		controller.abort();
	};

	useEffect(() => {
		const fetchData = async () => {
			if (skip) return;
			dispatch({ schema, type: 'FETCH_INIT' });
			try {
				const options = {
					method: 'GET',
					mode: 'cors',
					cache: 'no-cache',
					credentials: 'same-origin',
					/*headers: {
				      'Content-Type': 'application/json',
				      //...headers
				    },*/
					redirect: 'follow',
					referrerPolicy: 'no-referrer',
					//body: body ? JSON.stringify(data) : {},
				};

				worker.postMessage(JSON.stringify({ endpoint: `${url}?${queryString}`, options }));
				worker.onmessage = function (event) {
					const { type, data } = event.data;

					if (type === 'apiResponse') {
						dispatch({ schema, type: 'FETCH_SUCCESS', payload: data });
						safelyExecuteFunction(successCallback, null, data);
					}
				};
			} catch (err) {
				setErrorMessage(err.message);
				dispatch({ schema, type: 'FETCH_FAILURE' });
				safelyExecuteFunction(failureCallback, null, err);
			} finally {
				dispatch({ schema, type: 'FETCH_STOP' });
			}
		};

		fetchData();

		return () => {};
	}, [url, queryString, refetchIndex, schema, skip, controller.signal, successCallback, failureCallback]);

	return useMemo(() => ({
		state: { ...state[schema] },
		errorMessage,
		updateUrl,
		updateQueryParams,
		refetch,
		abortFetching,
	}));
};

export default useFetch;
