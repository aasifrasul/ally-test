import React from 'react';

import { fetchData, getList, addItem } from '.';

import { constants } from '../../constants';

const schema = 'searchForm';

const headers = {
	'Content-Type': 'application/json',
	api_key: constants.dataSources[schema].API_KEY,
};

export function fetchSearchFormData() {
	return fetchData(schema, { headers });
}

export function getSearchFormList() {
	return getList(schema);
}

export function addSearchFormItem(data) {
	return addItem(schema, data, { headers });
}
