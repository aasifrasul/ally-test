import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useFetchStore, useFetchDispatch } from '../../Context/dataFetchContext';
import useWebWorker from '../useWebWorker';

const hashMap = new Map();

const useFetch = (schema, baseUrl, initialParams = {}, timeout = 2000) => {
	const { fetchAPIData } = useWebWorker();
	const [params, setParams] = useState(initialParams);
	const [errorMessage, setErrorMessage] = useState('');
	const timeoutId = React.useRef(false);
	let ignore = false;
	//const abortController = React.useRef(false);

	const state = useFetchStore();
	const dispatch = useFetchDispatch();

	const updateQueryParams = (data) => setParams((oldData) => ({ ...oldData, ...data }));
	const queryString = Object.keys(params)
		.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
		.join('&');

	const endPoint = `${baseUrl}?${queryString}`;
	const key = `${schema}:${endPoint}`;

	//const abortFetch = () => abortController.current.abort();

	const cleanup = () => {
		clearTimeout(timeoutId.current);
		ignore = true;;
		//!abortController.current?.signal?.aborted && abortFetch();
	};

	const fetchData = async () => {
		dispatch({ schema, type: 'FETCH_INIT' });

		//abortController.current = new AbortController();

		try {
			if (hashMap.has(key)) {
				dispatch({ schema, type: 'FETCH_SUCCESS', payload: hashMap.get(key) });
			} else {
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
				if (!ignore) {
					hashMap.set(key, data);
					dispatch({ schema, type: 'FETCH_SUCCESS', payload: data });
				}
			}
		} catch (err) {
			setErrorMessage(err.message);
			dispatch({ schema, type: 'FETCH_FAILURE' });
			if (err?.name === 'AbortError') {
				console.log('Request Aborted');
				// Aborting a fetch throws an error
				// So we can't update state afterwards
			}
		} finally {
			cleanup();
			dispatch({ schema, type: 'FETCH_STOP' });
		}
	};

	useEffect(() => {
		ignore = false;
		fetchData();
		return () => {
			cleanup();
		};
	}, [queryString]);

	return {
		state: state[schema],
		errorMessage,
		updateQueryParams,
		//abortFetch,
	};
};

export default useFetch;
