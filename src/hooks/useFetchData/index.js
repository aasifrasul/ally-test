import { useState, useEffect, useCallback } from 'react';

import useWebWorker from '../useWebWorker';

const useFetchData = () => {
	const { fetchAPIData, abortFetchRequest } = useWebWorker();
	const [data, setData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchData = useCallback((endPoint, options) => {
		if (!endPoint) {
			return;
		}

		setIsLoading(true);

		const abortFetch = () => abortFetchRequest(endPoint);

		const fetchLazy = async () => {
			try {
				const data = await fetchAPIData(endPoint, options);
				setData(data);
			} catch (err) {
				if (err.name === 'AbortError') {
					console.log(err);
				} else {
					setError(err);
				}
			} finally {
				abortFetch();
				setIsLoading(false);
			}
		};

		fetchLazy();

		return abortFetch;
	}, []);

	useEffect(() => {
		return () => setIsLoading(false);
	}, []);

	return { data, isLoading, error, fetchData };
};

export default useFetchData;
