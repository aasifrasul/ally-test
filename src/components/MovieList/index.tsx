import { JSX, useEffect } from 'react';

import { useSchemaQuery } from '../../hooks/dataSelector';

import { Schema, APIDataTypes } from '../../constants/types';

import { MovieList } from './MovieList';

interface ParentProps {
	className?: string;
	[key: string]: any;
}

function MovieListContainer(props: ParentProps): JSX.Element {
	const { fetchData, fetchNextPage, ...result } = useSchemaQuery(Schema.MOVIE_LIST);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (!result.data) return <div>Loading...</div>;

	return (
		<MovieList
			{...props}
			{...(result as APIDataTypes)}
			schema={Schema.MOVIE_LIST}
			fetchNextPage={fetchNextPage}
		/>
	);
}

export default MovieListContainer;
