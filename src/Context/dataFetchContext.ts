import React from 'react';
import storeFactory from '../store/storeFactory';
import dataFetchReducer from '../reducers/dataFetchReducer';
import { constants } from '../constants';

const { dataSources } = constants;

// Define the structure of initialState
interface InitialState {
	isLoading: boolean;
	isError: boolean;
	data: Record<string, unknown>;
	currentPage: number | undefined;
}

const initialState: Record<string, InitialState> = {};

// Populate initialState based on dataSources
Object.keys(dataSources).forEach((key) => {
	initialState[key] = {
		isLoading: false,
		isError: false,
		data: {},
		currentPage: dataSources[key].queryParams?.page ?? 0,
	};
});

// Use the storeFactory with the correct types
const [FetchStoreProvider, useFetchStore] = storeFactory<Record<string, InitialState>>(
	dataFetchReducer,
	initialState,
);

export { FetchStoreProvider, useFetchStore };
