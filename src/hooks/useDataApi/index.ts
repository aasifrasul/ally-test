import { useEffect, useReducer, useState } from 'react';
import dataFetchReducer from '../../reducers/dataFetchReducer';

export const useDataApi = (initialUrl: string, initialData: Record<string, unknown>) => {
	const [url, setUrl] = useState(initialUrl);

	const [state, dispatch] = useReducer(dataFetchReducer, {
		isLoading: false,
		isError: false,
		data: initialData,
	});

	useEffect(() => {
		let didCancel = false;

		const fetchData = async () => {
			dispatch({ type: 'FETCH_INIT' });

			try {
				const result = await fetch(url);

				if (!didCancel) {
					dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
				}
			} catch (error) {
				if (!didCancel) {
					dispatch({ type: 'FETCH_FAILURE' });
				}
			}
		};

		fetchData();

		return () => {
			didCancel = true;
		};
	}, [url]);

	return [state, setUrl];
};
