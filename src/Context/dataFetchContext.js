import React from 'react';

import storeFactory from '../store/storeFactory';
import dataFetchReducer from '../reducers/dataFetchReducer';
import { constants } from '../utils/Constants';

const { dataFetchModules } = constants;
const initialState = {};

for (const key in dataFetchModules) {
	initialState[key] = {
		isLoading: false,
		isError: false,
		data: {},
		currentPage: dataFetchModules[key]?.queryParams?.page,
	};
}

const [FetchStoreProvider, useFetchStore] = storeFactory(dataFetchReducer, initialState);

export { FetchStoreProvider, useFetchStore };
