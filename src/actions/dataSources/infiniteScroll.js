import React from 'react';

import { fetchData, getList, fetchNextPage } from '.';

const schema = 'infiniteScroll';

export function fetchInfiniteScrollData() {
	return fetchData(schema);
}

export function getInfiniteScrollList() {
	return getList(schema);
}

export function fetchInfiniteScrollNextPage(nextPage) {
	return fetchNextPage(schema, nextPage);
}
