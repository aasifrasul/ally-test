import { useCallback, useEffect, useRef, useState } from 'react';

import { abortFetchRequest, fetchAPIData } from '../../workers/WorkerHelper';
import { useSelector } from '../dataSelector';
import { createActionHooks } from '../createActionHooks';

import { buildQueryParams } from '../../utils/common';
import { constants } from '../../constants';

const useFetch = (schema, timeout = 2000) => {
	const { useFetchActions, useUpdateActions, usePageActions } = createActionHooks(schema);
	const { fetchStarted, fetchSucceeded, fetchFailed, fetchCompleted } = useFetchActions();
	const { updateStarted, updateSucceeded, updateFailed, updateCompleted } =
		useUpdateActions();
	const { advancePage } = usePageActions();
	const [ignore, setIgnore] = useState(false);

	const { BASE_URL, queryParams } = constants?.dataSources[schema];

	const timeoutId = useRef(false);
	const pageRef = useRef(queryParams?.page);

	const fetchNextPage = () => {
		queryParams.page = ++pageRef.current;
		fetchData();
	};

	const fetchData = useCallback((options = {}) => {
		fetchStarted();

		const cleanUp = () => {
			clearTimeout(timeoutId.current);
			abortFetch();
		};

		timeoutId.current = setTimeout(() => cleanUp(), timeout);
		const url = `${BASE_URL}?${buildQueryParams(queryParams)}`;

		const abortFetch = () => abortFetchRequest(url);

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
				await fetchAPIData(url, enhancedOptions);
				if (!ignore) {
					fetchSucceeded();
				}
				if (queryParams.page) {
					advancePage(queryParams.page);
				}
			} catch (err) {
				--pageRef.current;
				fetchFailed();
				console.log(err);
			} finally {
				fetchCompleted();
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

	function getList(schema) {
		return useSelector((store) => store[schema]);
	}

	return {
		getList,
		fetchData,
		fetchNextPage,
	};
};

export default useFetch;
