import { useEffect, JSX } from 'react';
import { InfiniteScroll } from './InfiniteScroll';
import { Schema } from '../../constants/types';
import { toArrayData } from '../../utils/common';
import { useSchemaQuery } from '../../hooks/dataSelector';
import { IS_Item } from '../../types/infiniteScroll';

interface ParentProps {
	className?: string;
	[key: string]: any;
}

function InfiniteScrollContainer(props: ParentProps): JSX.Element {
	const { fetchData, fetchNextPage, data, ...result } = useSchemaQuery(
		Schema.INFINITE_SCROLL,
	);
	const normalizedData = toArrayData<IS_Item>(data);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (result.isLoading && normalizedData.length === 0) {
		return <div className="text-center mt-10">Loading...</div>;
	}

	if (!result.isLoading && normalizedData.length === 0) {
		return <div className="text-center mt-10">No Records found</div>;
	}

	return (
		<InfiniteScroll
			{...props}
			{...result}
			schema={Schema.INFINITE_SCROLL}
			data={normalizedData}
			fetchNextPage={fetchNextPage}
			data-testid="infinite-scroll"
			data-hasmore={normalizedData.length > 0 ? 'true' : 'false'}
		/>
	);
}

export default InfiniteScrollContainer;
