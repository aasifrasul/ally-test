import { useEffect } from 'react';
import { InfiniteScroll } from './InfiniteScroll';
import useFetch, { UseFetchResult } from '../../hooks/useFetch';
import { InitialState, Schema, ChildComponentProps } from '../../constants/types';

interface ParentProps {}

function InfiniteScrollContainer(props: ParentProps): JSX.Element {
	const useFetchResult: UseFetchResult<InitialState, InitialState> = useFetch(
		Schema.INFINITE_SCROLL,
	);
	const { cleanUpTopLevel, getList, fetchData, fetchNextPage } = useFetchResult;
	const result: InitialState = getList(Schema.INFINITE_SCROLL);

	useEffect(() => {
		fetchData();
		return () => cleanUpTopLevel();
	}, []);

	const infiniteScrollProps: ChildComponentProps = {
		...props,
		fetchNextPage,
		...result,
	};

	return <InfiniteScroll {...infiniteScrollProps} />;
}

export default InfiniteScrollContainer;
