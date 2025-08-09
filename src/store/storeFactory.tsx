import React, { createContext, useReducer, useMemo, ReactNode, Dispatch } from 'react';

import useContextFactory from '../Context/useContextFactory';

import {
	GenericState,
	GenericReducer,
	GenericAction,
	Schema,
	StoreContextValue,
	Store,
} from '../constants/types';

import { createLogger, LogLevel, Logger } from '../utils/Logger';

const logger: Logger = createLogger('storeFactory', {
	level: LogLevel.DEBUG,
});

function storeFactory<T extends GenericState>(
	reducer: GenericReducer,
	initialState: T,
): [React.FC<{ children: ReactNode }>, () => StoreContextValue<T>] {
	const GenericContext = createContext<StoreContextValue<T> | undefined>(undefined);

	const StoreProvider = (props: { children: ReactNode }) => {
		let state: GenericState;
		let dispatch: Dispatch<GenericAction>;
		[state, dispatch] = useReducer(reducer, initialState);

		const store: Store<T> = useMemo(
			() => ({
				getState: (schema: Schema) => state[schema],
			}),
			[state],
		);

		const proxyStore = useMemo(
			() =>
				new Proxy(store, {
					get(target: Store<T>, prop: Schema) {
						logger.debug('prop:', prop);
						return target.getState(prop);
					},
				}),
			[store],
		);

		const value = useMemo(() => ({ dispatch, store: proxyStore }), [dispatch, proxyStore]);

		return (
			<GenericContext.Provider value={value}>{props.children}</GenericContext.Provider>
		);
	};

	StoreProvider.displayName = `${typeof initialState}_StoreProvider`;

	const useStore = useContextFactory('GenericContext.Provider', GenericContext);

	return [StoreProvider, useStore as () => StoreContextValue<T>];
}

export default storeFactory;
