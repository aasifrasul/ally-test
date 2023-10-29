import React, { useState, useCallback, useEffect } from 'react';

import useWebWorker from '../useWebWorker';

import { buildQueryParams } from '../../utils/common';

const useFetch = (schema, dispatch, timeout = 2000) => {
	const [ignore, setIgnore] = useState(false);
	const timeoutId = React.useRef(false);

	const { fetchAPIData, abortFetchRequest } = useWebWorker();

	const fetchNextPage = () => dispatch({ schema, type: 'ADVANCE_PAGE' });

	const fetchData = useCallback((endPoint, queryParams = {}, options = {}) => {
		dispatch({ schema, type: 'FETCH_INIT' });

		const abortFetch = () => abortFetchRequest(url);

		const cleanUp = () => {
			clearTimeout(timeoutId.current);
			abortFetch();
		};

		timeoutId.current = setTimeout(() => cleanUp(), timeout);
		const url = `${endPoint}?${buildQueryParams(queryParams)}`;

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
				!ignore && dispatch({ schema, type: 'FETCH_SUCCESS', payload: data });
			} catch (err) {
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
