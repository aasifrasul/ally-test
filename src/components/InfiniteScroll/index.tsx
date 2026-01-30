import { useEffect, JSX } from 'react';
import { InfiniteScroll } from './InfiniteScroll';
import { Schema } from '../../constants/types';
import { handleAsyncCalls } from '../../utils/common';
import { useSchemaQuery } from '../../hooks/dataSelector';

interface ParentProps {
	className?: string;
	[key: string]: any;
}

function InfiniteScrollContainer(props: ParentProps): JSX.Element {
	const { fetchData, fetchNextPage, ...result } = useSchemaQuery(Schema.INFINITE_SCROLL);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Handle initial loading state
	if (result.isLoading && !result.data?.length) {
		return <div className="text-center mt-10">Loading...</div>;
	}

	// Handle empty state
	if (!result.isLoading && !result.data?.length) {
		return <div className="text-center mt-10">No Records found</div>;
	}

	return (
		<InfiniteScroll
			{...props}
			{...result}
			fetchNextPage={fetchNextPage}
			data-testid="infinite-scroll"
			data-hasmore={'true'}
		/>
	);
}

export default InfiniteScrollContainer;
