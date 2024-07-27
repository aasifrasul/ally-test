import { fetchData, updateData } from '../../utils/APIHelper';

import useSelector from '../../hooks/useSelector';

import { constants } from '../../constants';

const nextPageHash = {};

export function fetchData(schema, options) {
	const {
		BASE_URL,
		queryParams,
		timeout,
		options: defaultOptions,
	} = constants.dataSources[schema];
	if (nextPageHash[schema]) {
		queryParams.page = nextPageHash[schema];
		delete nextPageHash[schema];
	}
	return fetchData(schema, BASE_URL, queryParams, options || defaultOptions, timeout);
}

export function fetchNextPage(schema, nextPage, options) {
	nextPageHash[schema] = nextPage;
	return fetchData(schema, options);
}

export function getList(schema) {
	const { isError, isLoading, data, currentPage, TOTAL_PAGES } = useSelector(
		(store) => store[schema],
	);
	return { isError, isLoading, data, currentPage, TOTAL_PAGES };
}

export function addItem(schema, data, options) {
	const { ADD_ITEM_URL, timeout, options: defaultOptions } = constants.dataSources[schema];
	return updateData(schema, data, ADD_ITEM_URL, null, options || defaultOptions, timeout);
}
