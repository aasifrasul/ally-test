import React from 'react';

import storeFactory from '../store/storeFactory';

import dataFetchReducer from '../reducers/dataFetchReducer';

const initialState = {
	isLoading: false,
	isError: false,
	data: [],
};

const [FetchStoreProvider, useFetchStore, useFetchDispatch] = storeFactory(dataFetchReducer, initialState);

export { FetchStoreProvider, useFetchStore, useFetchDispatch };
