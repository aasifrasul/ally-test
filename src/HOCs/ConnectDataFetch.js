import React from 'react';
import { useFetchStore } from '../Context/dataFetchContext';
import useFetch from '../hooks/useFetch';

const ConnectDataFetch = (WrappedComponent) => {
	function Wrapper(props) {
		const { store, dispatch } = useFetchStore();
		const state = store.getState();
		const { isLoading, data, currentPage } = state[WrappedComponent.schema];

		const { fetchData, fetchNextPage } = useFetch(WrappedComponent.schema, dispatch);

		const combinedProps = {
			...props,
			data,
			isLoading,
			currentPage,
			fetchNextPage,
			fetchData,
		};

		return <WrappedComponent {...combinedProps} />;
	}
	return Wrapper;
};

export default ConnectDataFetch;
