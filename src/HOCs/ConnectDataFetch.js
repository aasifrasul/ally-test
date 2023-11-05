import React, { useEffect } from 'react';
import useFetch from '../hooks/useFetch';
import useSelector from '../hooks/useSelector';

import { safelyExecuteFunction } from '../utils/typeChecking';

const ConnectDataFetch = (derivedProps) => (WrappedComponent) => {
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

		useEffect(() => {
			const cleanUp = fetchData();
			return () => cleanUp();
		}, []);

		return <WrappedComponent {...combinedProps} />;
	}
	return Wrapper;
};

const ConnectDataFetchWrapper = (mapStateToProps, mapDispatchToProps) => {
	const derivedProps = {
		...safelyExecuteFunction(mapStateToProps),
		...safelyExecuteFunction(mapDispatchToProps),
	};
	return ConnectDataFetch(derivedProps);
};

export default ConnectDataFetchWrapper;
