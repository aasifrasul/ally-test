import React from 'react';

import storeFactory from '../store/storeFactory';

import dataFetchReducer from '../reducers/dataFetchReducer';

const initialState = {
	wineConnoisseur: {
		isLoading: false,
		isError: false,
		data: {},
	},
	infiniteScroll: {
		isLoading: false,
		isError: false,
		data: {},
	},
	movieList: {
		isLoading: false,
		isError: false,
		data: {},
	},
	nestedCategories: {
		isLoading: false,
		isError: false,
		data: {},
	},
};

const [FetchStoreProvider, useFetchStore, useFetchDispatch] = storeFactory(dataFetchReducer, initialState);

export { FetchStoreProvider, useFetchStore, useFetchDispatch };
