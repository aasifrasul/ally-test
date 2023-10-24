import React from 'react';

import storeFactory from '../store/storeFactory';

import dataFetchReducer from '../reducers/dataFetchReducer';

const initialState = {};

['wineConnoisseur', 'infiniteScroll', 'movieList', 'nestedCategories'].forEach((key) => {
	initialState[key] = {
		isLoading: false,
		isError: false,
		data: {},
	};
});

const [FetchStoreProvider, useFetchStore] = storeFactory(dataFetchReducer, initialState);

export { FetchStoreProvider, useFetchStore };
