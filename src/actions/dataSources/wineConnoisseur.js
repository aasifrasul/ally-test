import React from 'react';

import { fetchData, getList, fetchNextPage } from '.';

const schema = 'wineConnoisseur';

export function fetchWineConnoisseurData() {
	return fetchData(schema);
}

export function getWineConnoisseurList() {
	return getList(schema);
}

export function fetchWineConnoisseurNextPage(nextPage) {
	return fetchNextPage(schema, nextPage);
}
