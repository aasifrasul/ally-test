import { JSX, useEffect } from 'react';

import { useSchemaQuery } from '../../hooks/dataSelector';

import { Schema, APIDataTypes } from '../../constants/types';

import { MovieList } from './MovieList';

interface ParentProps {
	className?: string;
	[key: string]: any;
}

export default function MovieListContainer(props: ParentProps): JSX.Element {
	const { fetchData, fetchNextPage, ...result } = useSchemaQuery(Schema.MOVIE_LIST);

	useEffect(() => {
		fetchData();
	}, []);

	// Handle initial loading state
	if (result.isLoading && !result.data?.length) {
		return <div className="text-center mt-10">Loading...</div>;
	}

	// Handle empty state
	if (!result.isLoading && !result.data?.length) {
		return <div className="text-center mt-10">No Records found</div>;
	}

	return (
		<MovieList
			{...props}
			{...(result as APIDataTypes)}
			schema={Schema.MOVIE_LIST}
			fetchNextPage={fetchNextPage}
		/>
	);
}
