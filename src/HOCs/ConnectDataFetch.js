import React, { useEffect } from 'react';

import { useFetchStore } from '../Context/dataFetchContext';

import { safelyExecuteFunction, isObject, isFunction } from '../utils/typeChecking';

const connectDataFetch =
	(mapStateToProps = {}, mapDispatchToProps = {}) =>
	(WrappedComponent) => {
		return function Wrapper(props) {
			const { dispatch } = useFetchStore();
			const customDispatch = new CustomEvent('customDispatch', {
				detail: {
					dispatch,
				},
			});

			window.dispatchEvent(customDispatch);

			const combinedProps = {
				...props,
				...buildProps(mapStateToProps),
				...buildProps(mapDispatchToProps),
			};

			return <WrappedComponent {...combinedProps} />;
		};
	};

const buildProps = (propsFetcher = {}) => {
	if (isFunction(propsFetcher)) {
		return safelyExecuteFunction(propsFetcher);
	} else if (isObject(propsFetcher)) {
		return {
			...propsFetcher,
		};
	} else {
		throw new Error('Type mismatch: Param needs to be either a Function or an object');
	}
};

export default connectDataFetch;
