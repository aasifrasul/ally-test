import React from 'react';

import storeFactory from '../store/storeFactory';
import dataFetchReducer from '../reducers/dataFetchReducer';
import { constants } from '../utils/Constants';

const initialState = {};

['wineConnoisseur', 'infiniteScroll', 'movieList', 'nestedCategories'].forEach((key) => {
	initialState[key] = {
		isLoading: false,
		isError: false,
		data: {},
		currentPage: constants[key]?.queryParams?.page,
	};
});

const [FetchStoreProvider, useFetchStore] = storeFactory(dataFetchReducer, initialState);

export { FetchStoreProvider, useFetchStore };
