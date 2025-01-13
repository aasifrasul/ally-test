import { useEffect } from 'react';
import { InfiniteScroll } from './InfiniteScroll';
import useFetch, { FetchResult } from '../../hooks/useFetch';
import { InitialState, Schema } from '../../constants/types';
import { handleAsyncCalls } from '../../utils/common';

interface ParentProps {
	className?: string;
	[key: string]: any;
}

function InfiniteScrollContainer(props: ParentProps): JSX.Element {
	const useFetchResult: FetchResult<InitialState, InitialState> = useFetch(
		Schema.INFINITE_SCROLL,
	);

	const { cleanUpTopLevel, getList, fetchData, fetchNextPage } = useFetchResult;
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
