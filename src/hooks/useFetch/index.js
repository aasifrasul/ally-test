import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useFetchStore, useFetchDispatch } from '../../Context/dataFetchContext';
import useWebWorker from '../useWebWorker';

const useFetch = (schema, baseUrl, initialParams = {}, timeout = 2000) => {
	const { fetchAPIData, abortFetchRequest } = useWebWorker();
	const [params, setParams] = useState(initialParams);
	const [errorMessage, setErrorMessage] = useState('');
	const timeoutId = React.useRef(false);

	const state = useFetchStore();
	const dispatch = useFetchDispatch();

	const updateQueryParams = (data) => setParams((oldData) => ({ ...oldData, ...data }));
	const queryString = Object.keys(params)
		.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
		.join('&');

	const endPoint = `${baseUrl}?${queryString}`;
	const key = `${schema}:${endPoint}`;

	const cleanup = () => {
		clearTimeout(timeoutId.current);
		abortFetch();
	};

	const abortFetch = () => abortFetchRequest(endPoint);

	const fetchData = async () => {
		dispatch({ schema, type: 'FETCH_INIT' });

		try {
			timeoutId.current = setTimeout(() => {
				cleanup();
			}, timeout);

			const options = {
				method: 'GET',
				//mode: 'cors',
				//cache: 'no-cache',
				//credentials: 'same-origin',
				/*headers: {
					'Content-Type': 'application/json',
					//...headers
					},*/
				//redirect: 'follow',
				//referrerPolicy: 'no-referrer',
				//signal: abortController.current.signal,
				//body: body ? JSON.stringify(data) : {},
			};

			const data = await fetchAPIData(endPoint, options);
			data && dispatch({ schema, type: 'FETCH_SUCCESS', payload: data });
		} catch (err) {
			dispatch({ schema, type: 'FETCH_FAILURE' });
			if (err?.name === 'AbortError') {
				console.log('Request Aborted');
			} else {
				setErrorMessage(() => err.message);
			}
		} finally {
			dispatch({ schema, type: 'FETCH_STOP' });
			cleanup();
		}
	};

	useEffect(() => {
		fetchData();
		return cleanup;
	}, [queryString]);

	return {
		state: state[schema],
		errorMessage,
		updateQueryParams,
		abortFetch,
	};
};

export default useFetch;
