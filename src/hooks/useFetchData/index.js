import { useState, useEffect } from 'react';

const useFetchData = (url) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const abortController = new AbortController();
	const signal = abortController.signal;

	useEffect(() => {
		setLoading(true);

		const fetchData = async () => {
			try {
				let response = await fetch(url, { signal });
				response = await response.json();
				setData(response);
			} catch (err) {
				if (err.name === 'AbortError') {
					console.log(err);
				} else {
					setError(err);
				}
			} finally {
				setLoading(false);
			}
		};

		fetchData();

		return () => {
			setLoading(false);
			abortController.abort();
		};
	}, [url]);

	return { data, loading, error };
};

export default useFetchData;
