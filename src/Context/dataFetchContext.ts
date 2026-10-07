import React from 'react';

import { createStoreContext } from '../store/createStore';
import dataFetchReducer from '../reducers/dataFetchReducer';
import { constants } from '../constants';
import { InitialState, GenericState, StoreContextValue } from '../constants/types';

const dataSources = constants.dataSources;

if (!dataSources) {
	throw new Error('dataSources is undefined');
}

function createDefaultDataFetchState(): GenericState {
	const initialState: GenericState = {};

	function createSchemaState(): InitialState {
		return {
			isLoading: false,
			isError: false,
			data: [],
			originalData: [],
			pageData: [],
			headers: [],
			currentPage: 0,
			TOTAL_PAGES: 0,
		};
	}

	Object.entries(dataSources as Record<string, any>).forEach(([key, dataSource]) => {
		const individualState = createSchemaState();
		individualState.currentPage = dataSource.queryParams?.page || 0;
		initialState[key] = individualState;
	});

	return initialState;
}

export function createDataFetchContext<T extends GenericState = GenericState>(
	reducer: typeof dataFetchReducer = dataFetchReducer,
	initialState: T = createDefaultDataFetchState() as T,
	config?: { name?: string },
): [React.FC<{ children?: React.ReactNode }>, () => StoreContextValue<T>] {
	const [Provider, useStore] = createStoreContext(reducer, initialState, {
		name: config?.name ?? 'FetchStoreContext.Provider',
	}) as [React.FC<{ children?: React.ReactNode }>, () => StoreContextValue<T>];

	return [Provider, useStore];
}

const [FetchStoreProvider, useFetchStore] = createDataFetchContext();

export { FetchStoreProvider, useFetchStore };
