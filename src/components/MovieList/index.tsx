import { JSX, useEffect } from 'react';

import { useSchemaQuery } from '../../hooks/dataSelector';

import { Schema } from '../../constants/types';
import { toArrayData } from '../../utils/common';
import { Movie_Item } from '../../types/movieList';

import { MovieList } from './MovieList';

interface ParentProps {
	className?: string;
	[key: string]: any;
}

export default function MovieListContainer(props: ParentProps): JSX.Element {
	const { fetchData, fetchNextPage, data, ...result } = useSchemaQuery(Schema.MOVIE_LIST);
	const normalizedData = toArrayData<Movie_Item>(data);

	useEffect(() => {
		// Debug: ensure fetch is invoked on mount
		// eslint-disable-next-line no-console
		console.debug('MovieListContainer: invoking fetchData on mount');
		fetchData();
	}, [fetchData]);

	// Debug: log schema result shape
	// eslint-disable-next-line no-console
	console.debug('MovieListContainer: result=', result);

	if (result.isLoading && normalizedData.length === 0) {
		return <div className="text-center mt-10">Loading...</div>;
	}

	if (!result.isLoading && normalizedData.length === 0) {
		return <div className="text-center mt-10">No Records found</div>;
	}

	return (
		<MovieList
			{...props}
			{...result}
			schema={Schema.MOVIE_LIST}
			data={normalizedData}
			fetchNextPage={fetchNextPage}
		/>
	);
}
