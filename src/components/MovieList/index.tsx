import { useEffect } from 'react';

import { MovieList } from './MovieList';
import useFetch, { FetchResult } from '../../hooks/useFetch';
import { InitialState, Schema } from '../../constants/types';

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
			try {
				await fetchData();
			} catch (error) {
				console.error('Failed to fetch initial data:', error);
			}
		};

		fetchInitialData();
		return () => cleanUpTopLevel();
	}, []);

	return (
		<MovieList
			{...props}
			{...result}
			schema={Schema.MOVIE_LIST}
			fetchNextPage={fetchNextPage}
			data-testid="movie-list"
			data-hasmore={'true'}
		/>
	);
}

export default MovieListContainer;
