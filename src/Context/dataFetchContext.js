import React from 'react';

import storeFactory from '../store/storeFactory';
import dataFetchReducer from '../reducers/dataFetchReducer';
import { constants } from '../constants';

const { dataSources } = constants;
const initialState = {};

for (const key in dataSources) {
	initialState[key] = {
		isLoading: false,
		isError: false,
		data: {},
		currentPage: dataSources[key]?.queryParams?.page,
	};
}

const [FetchStoreProvider, useFetchStore] = storeFactory(dataFetchReducer, initialState);

export { FetchStoreProvider, useFetchStore };
