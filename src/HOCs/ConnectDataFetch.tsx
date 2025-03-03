import { ComponentType } from 'react';
import { useFetchStore } from '../Context/dataFetchContext';
import { isObject, isFunction } from '../utils/typeChecking';

interface MapStateToProps {
	[key: string]: any;
}

interface MapDispatchToProps {
	[key: string]: any;
}

type PropsFetcher =
	| MapStateToProps
	| MapDispatchToProps
	| (() => MapStateToProps | MapDispatchToProps);

const connectDataFetch =
	(mapStateToProps: PropsFetcher = {}, mapDispatchToProps: PropsFetcher = {}) =>
	<P extends object>(WrappedComponent: ComponentType<P>) => {
		return function Wrapper(props: P) {
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

const buildProps = (propsFetcher: PropsFetcher = {}): MapStateToProps | MapDispatchToProps => {
	if (isFunction(propsFetcher)) {
		return propsFetcher();
	} else if (isObject(propsFetcher)) {
		return {
			...(propsFetcher as MapStateToProps | MapDispatchToProps),
		};
	} else {
		throw new Error('Type mismatch: Param needs to be either a Function or an object');
	}
};

export default connectDataFetch;
