import React from 'react';

import WineConnoisseur from './WineConnoisseur';

import { InitialState, Schema } from '../../constants/types';
import useFetch, { FetchResult } from '../../hooks/useFetch';

export default function WineConnoisseurContainer() {
	const result: FetchResult<InitialState> = useFetch(Schema.WINE_CONNOISSUER);
	const { cleanUpTopLevel, getList, fetchData, fetchNextPage } = result;
	const { headers, pageData, isLoading, isError, currentPage = 0 } = getList(
		Schema.WINE_CONNOISSUER,
	);

	React.useEffect(() => {
		fetchData();
		window.requestIdleCallback(() => fetchNextPage(currentPage + 1))
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
