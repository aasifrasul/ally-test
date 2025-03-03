import { JSX, useEffect } from 'react';

import useFetch, { FetchResult } from '../../hooks/useFetch';
import { handleAsyncCalls } from '../../utils/common';
import { InitialState, Schema } from '../../constants/types';

import { MovieList } from './MovieList';

interface ParentProps {
	className?: string;
	[key: string]: any;
}

function MovieListContainer(props: ParentProps): JSX.Element {
	const useFetchResult: FetchResult<InitialState, InitialState> = useFetch(
		Schema.MOVIE_LIST,
	);

	const { cleanUpTopLevel, getList, fetchData, fetchNextPage } = useFetchResult;
	const result: InitialState = getList(Schema.MOVIE_LIST);

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

	if (!result.data) return <div>Loading...</div>;

	return (
		<MovieList
			{...props}
			{...result}
			schema={Schema.MOVIE_LIST}
			fetchNextPage={fetchNextPage}
		/>
	);
}

export default MovieListContainer;
