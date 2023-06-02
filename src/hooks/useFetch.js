import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { useFetchStore, useFetchDispatch } from '../Context/dataFetchContext';
import worker from '../workers/MyWorker';

const useFetch = (schema, initialUrl, initialParams = {}) => {
	const [params, updateParams] = useState(initialParams);
	const [errorMessage, setErrorMessage] = useState('');
	const queryString = Object.keys(params)
		.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
		.join('&');

	const controller = useRef(new AbortController());
	const abortFetching = () => controller?.current.abort();

	const state = useFetchStore();
	const dispatch = useFetchDispatch();

	const updateQueryParams = (queryParams) =>
		updateParams((currentData) => ({ ...currentData, ...queryParams }));

	const fetchData = useCallback(() => {
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

			worker.postMessage(
				JSON.stringify({ endpoint: `${initialUrl}?${queryString}`, options }),
			);
			worker.onmessage = function (event) {
				const { type, data } = event.data;

				if (type === 'apiResponse') {
					dispatch({ schema, type: 'FETCH_SUCCESS', payload: data });
				}
			};
		} catch (err) {
			setErrorMessage(err.message);
			dispatch({ schema, type: 'FETCH_FAILURE' });
		} finally {
			dispatch({ schema, type: 'FETCH_STOP' });
		}
	}, [`${initialUrl}?${queryString}`, worker]);

	useEffect(() => {
		fetchData();
		return () => abortFetching();
	}, [fetchData, schema]);

	return useMemo(
		() => ({
			state: { ...state[schema] },
			errorMessage,
			updateQueryParams,
			abortFetching,
		}),
		[schema, errorMessage, updateQueryParams],
	);
};

export default useFetch;
