import React, { useEffect } from 'react';
import useFetch from '../hooks/useFetch';
import useSelector from '../hooks/useSelector';

import { safelyExecuteFunction, isObject, isFunction } from '../utils/typeChecking';

const connectDataFetchInner = (derivedProps) => (WrappedComponent) => {
	return function Wrapper(props) {
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
	};
};

const buildProps = (propsfetcher = {}) => {
	if (isFunction(propsfetcher)) {
		return safelyExecuteFunction(propsfetcher);
	} else if (isObject(propsfetcher)) {
		return {
			...propsfetcher,
		};
	} else {
		throw new Error('Type mismatch: Param needs to be either a Function or an object');
	}
};

const connectDataFetch = (mapStateToProps = {}, mapDispatchToProps = {}) =>
	connectDataFetchInner({
		...buildProps(mapStateToProps),
		...buildProps(mapDispatchToProps),
	});

export default connectDataFetch;
