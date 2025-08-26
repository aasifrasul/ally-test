import { useEffect } from 'react';

import WineConnoisseur from './WineConnoisseur';

import { Schema } from '../../constants/types';
import { useSchemaQuery } from '../../hooks/dataSelector';

export default function WineConnoisseurContainer() {
	const {
		headers,
		pageData,
		isLoading,
		isError,
		currentPage = 0,
		fetchData,
		fetchNextPage,
	} = useSchemaQuery(Schema.WINE_CONNOISSUER);

	useEffect(() => {
		fetchData();
		// window.requestIdleCallback(() => fetchNextPage(currentPage + 1))
	}, [fetchData]);

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
