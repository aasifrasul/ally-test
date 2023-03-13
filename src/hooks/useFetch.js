import React, { useState, useEffect, useMemo } from 'react';

import { useFetchStore, useFetchDispatch } from '../Context/dataFetchContext';
import { safelyExecuteFunction } from '../utils/typeChecking';

const controller = new AbortController();

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
					signal: controller.signal,
				};
				const response = await fetch(`${url}?${queryString}`, options);
				const result = await response.json();
				if (response.ok) {
					dispatch({ schema, type: 'FETCH_SUCCESS', payload: result });
					safelyExecuteFunction(successCallback, null, result);
				} else {
					dispatch({ schema, type: 'FETCH_FAILURE' });
					safelyExecuteFunction(failureCallback, null, result);
				}
			} catch (err) {
				setErrorMessage(err.message);
				dispatch({ schema, type: 'FETCH_FAILURE' });
				safelyExecuteFunction(failureCallback, null, err);
			} finally {
				dispatch({ schema, type: 'FETCH_STOP' });
			}
		};

		fetchData();

		return () => {
			// abortFetching();
		};
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
