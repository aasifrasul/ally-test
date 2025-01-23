import { useEffect } from 'react';
import { NestedCategories } from './NestedCategories';
import useFetch, { FetchResult } from '../../hooks/useFetch';
import { InitialState, Schema } from '../../constants/types';
import { handleAsyncCalls } from '../../utils/common';

export default function NestedCategoriesContainer(): React.ReactElement {
	const useFetchResult: FetchResult<InitialState, InitialState> = useFetch(
		Schema.NESTED_CATEGORIES,
	);

	const { cleanUpTopLevel, getList, fetchData } = useFetchResult;
	const result: InitialState = getList(Schema.INFINITE_SCROLL);

	useEffect(() => {
		const fetchInitialData = async () => {
			const result = await handleAsyncCalls(fetchData());

			if (!result.success) {
				console.error('Failed to fetch:', result.error);
			}
		};

		fetchInitialData();
		return () => cleanUpTopLevel();
	}, []);

	return <NestedCategories {...result} />;
}
