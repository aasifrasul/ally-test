import React from 'react';
import useFetch from '../hooks/useFetch';
import useSelector from '../hooks/useSelector';

const ConnectDataFetch = (WrappedComponent) => {
	function Wrapper(props) {
		const { isError, isLoading, data, currentPage, dispatch } = useSelector((store) =>
			store.getState(WrappedComponent.schema),
		);

		const { fetchData, fetchNextPage } = useFetch(WrappedComponent.schema, dispatch);

		const combinedProps = {
			...props,
			data,
			isLoading,
			isError,
			currentPage,
			fetchNextPage,
			fetchData,
		};

		return <WrappedComponent {...combinedProps} />;
	}
	return Wrapper;
};

export default ConnectDataFetch;
