import React from 'react';

import APIHelper from '../../utils/APIHelper';
import useSelector from '../../hooks/useSelector';

import { constants } from '../../constants';

const nextPageHash = {};

const apiHelper = new APIHelper();

export function fetchData(schema, options) {
	const dataSource = constants.dataSources[schema];
	const { BASE_URL, queryParams, timeout } = dataSource;
	if (nextPageHash[schema]) {
		queryParams.page = nextPageHash[schema];
		delete nextPageHash[schema];
	}
	return apiHelper.fetchData(
		schema,
		BASE_URL,
		queryParams,
		options || dataSource.options,
		timeout,
	);
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
	const dataSource = constants.dataSources[schema];
	const { ADD_ITEM_URL, timeout } = dataSource;
	return apiHelper.updateData(
		schema,
		data,
		ADD_ITEM_URL,
		null,
		options || dataSource.options,
		timeout,
	);
}
