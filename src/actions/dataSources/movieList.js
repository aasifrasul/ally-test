import React from 'react';

import { fetchData, getList, fetchNextPage } from '.';

const schema = 'movieList';

export function fetchMovieListData() {
	return fetchData(schema);
}

export function getMovieListList() {
	return getList(schema);
}

export function fetchMovieListNextPage(nextPage) {
	return fetchNextPage(schema, nextPage);
}
