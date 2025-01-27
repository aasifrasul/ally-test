import React from 'react';

import WineConnoisseur from './WineConnoisseur';

import { InitialState, Schema } from '../../constants/types';
import useFetch, { FetchResult } from '../../hooks/useFetch';
import { handleAsyncCalls } from '../../utils/handleAsyncCalls';

export default function WineConnoisseurContainer() {
	const result: FetchResult<InitialState> = useFetch(Schema.WINE_CONNOISSUER);
	const { cleanUpTopLevel, getList, fetchData, fetchNextPage } = result;
	const { headers, pageData, isLoading, isError, currentPage } = getList(
		Schema.WINE_CONNOISSUER,
	);

	React.useEffect(() => {
		const fetchInitialData = async () => {
			const result = await handleAsyncCalls(fetchData());
			if (!result.success) {
				console.error('Failed to fetch:', result.error);
			}
		};
		fetchInitialData();
		return () => cleanUpTopLevel();
	}, []);

	return (
		<WineConnoisseur
			headers={headers as any}
			pageData={pageData as any}
			isLoading={isLoading ?? false}
			isError={isError ?? false}
			currentPage={currentPage ?? 0}
			fetchNextPage={fetchNextPage}
		/>
	);
}
