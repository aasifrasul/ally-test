import React, { useState, useCallback, useEffect } from 'react';

import useWebWorker from '../useWebWorker';

import { buildQueryParams } from '../../utils/common';
import { constants } from '../../constants';

const useFetch = (schema, dispatch, timeout = 2000) => {
	const [ignore, setIgnore] = useState(false);

	const { BASE_URL, queryParams } = constants?.dataSources[schema];

	const timeoutId = React.useRef(false);
	const pageRef = React.useRef(queryParams?.page);

	const { fetchAPIData, abortFetchRequest } = useWebWorker();

	const fetchNextPage = () => {
		queryParams.page = ++pageRef.current;
		fetchData();
	};

	const fetchData = useCallback((options = {}) => {
		dispatch({ schema, type: 'FETCH_INIT' });

		timeoutId.current = setTimeout(() => cleanUp(), timeout);
		const url = `${BASE_URL}?${buildQueryParams(queryParams)}`;

		const abortFetch = () => abortFetchRequest(url);

		const cleanUp = () => {
			clearTimeout(timeoutId.current);
			abortFetch();
		};

		const enhancedOptions = {
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
			//body: body ? JSON.stringify(data) : {},
			...options,
		};

		const fetchLazy = async () => {
			try {
				const data = await fetchAPIData(url, enhancedOptions);
				if (!ignore) {
					dispatch({ schema, type: 'FETCH_SUCCESS', payload: data });
				}
			} catch (err) {
				--pageRef.current;
				dispatch({ schema, type: 'FETCH_FAILURE' });
				console.log(err);
			} finally {
				dispatch({ schema, type: 'FETCH_STOP' });
				cleanUp();
			}
		};

		fetchLazy();

		return cleanUp;
	}, []);

	useEffect(() => {
		return () => {
			setIgnore(true);
		};
	});

	return {
		fetchData,
		fetchNextPage,
	};
};

export default useFetch;
