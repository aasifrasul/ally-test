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

import { createLogger, LogLevel, Logger } from '../utils/logger';

const logger: Logger = createLogger('storeFactory', {
	level: LogLevel.DEBUG,
});

function storeFactory<T extends GenericState>(
	reducer: GenericReducer,
	initialState: GenericState,
): [React.FC<{ children: ReactNode }>, () => StoreContextValue<T>] {
	const StoreContext = createContext<StoreContextValue<T> | undefined>(undefined);

	const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
		let state: GenericState;
		let dispatch: Dispatch<GenericAction>;
		[state, dispatch] = useReducer(reducer, initialState);

		const store: Store<GenericState> = useMemo(
			() => ({
				getState: (schema: Schema) => state[schema],
			}),
			[state],
		);

		const proxyStore = useMemo(
			() =>
				new Proxy(store, {
					get(target: Store<GenericState>, prop: Schema) {
						logger.debug('prop:', prop);
						return target.getState(prop);
					},
				}),
			[store],
		);

		const value = useMemo(() => ({ dispatch, store: proxyStore }), [dispatch, proxyStore]);

		return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
	};

	const useStore = useContextFactory('StoreContext.Provider', StoreContext);

	return [StoreProvider, useStore as () => StoreContextValue<T>];
}

export default storeFactory;
