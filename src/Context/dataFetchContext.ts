import React from 'react';
import storeFactory from '../store/storeFactory';
import dataFetchReducer from '../reducers/dataFetchReducer';
import { constants } from '../constants';
import { InitialState, GenericState } from '../constants/types';

const { dataSources } = constants;

if (!dataSources) {
	throw new Error('dataSources is undefined');
}

const initialState: GenericState = {};

// Populate initialState based on dataSources
Object.entries(dataSources).forEach(([key, dataSources]) => {
	const individualState: InitialState = {
		isLoading: false,
		isError: false,
		data: [],
		pageData: [],
		headers: [],
		currentPage: dataSources.queryParams?.page || 0,
		TOTAL_PAGES: 0,
	};
	initialState[key] = individualState;
});

// Use the storeFactory with the correct types
const [FetchStoreProvider, useFetchStore] = storeFactory<GenericState>(
	dataFetchReducer,
	initialState,
);

export { FetchStoreProvider, useFetchStore };
