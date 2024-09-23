import React from 'react';
import storeFactory from '../store/storeFactory';
import dataFetchReducer from '../reducers/dataFetchReducer';
import { constants } from '../constants';
import { InitialState } from './types';

const { dataSources } = constants;

const initialState: InitialState = {};

// Populate initialState based on dataSources
Object.keys(dataSources).forEach((key) => {
	initialState[key] = {
		isLoading: false,
		isError: false,
		data: [],
		currentPage: (dataSources[key].queryParams?.page as number) ?? 0,
		TOTAL_PAGES: 0,
	};
});

// Use the storeFactory with the correct types
const [FetchStoreProvider, useFetchStore] = storeFactory<InitialState>(
	dataFetchReducer,
	initialState,
);

export { FetchStoreProvider, useFetchStore };
