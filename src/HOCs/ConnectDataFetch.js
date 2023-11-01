import React from 'react';
import useFetch from '../hooks/useFetch';
import useSelector from '../hooks/useSelector';

import { safelyExecuteFunction } from '../utils/typeChecking';

let derivedProps = {};

const ConnectDataFetch = (WrappedComponent) => {
	function Wrapper(props) {
		const { schema } = WrappedComponent;
		const { isError, isLoading, data, currentPage, dispatch } = useSelector(
			(store) => store[schema],
		);

		const { fetchData, fetchNextPage } = useFetch(schema, dispatch);

		const combinedProps = {
			...props,
			...derivedProps,
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

const ConnectDataFetchWrapper = (mapStateToProps, mapDispatchToProps) => {
	derivedProps = {
		...safelyExecuteFunction(mapStateToProps),
		...safelyExecuteFunction(mapDispatchToProps),
	};
	return ConnectDataFetch;
};

export default ConnectDataFetchWrapper;
