import React from 'react';

import { fetchData, getList } from '.';

const schema = 'nestedCategories';

export function fetchNestedCategoriesData() {
	return fetchData(schema);
}

export function getNestedCategoriesList() {
	return getList(schema);
}
