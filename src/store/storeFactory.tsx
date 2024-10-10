import React, { createContext, useReducer, useMemo, ReactNode, Reducer } from 'react';

import useContextFactory from '../Context/useContextFactory';

import { StoreContextValue, Store } from './types';
import { GenericState, GenericReducer, Schema } from '../constants/types';

function storeFactory<T extends GenericState>(
	reducer: GenericReducer,
	initialState: GenericState,
): [React.FC<{ children: ReactNode }>, () => StoreContextValue<T>] {
	const StoreContext = createContext<StoreContextValue<T> | undefined>(undefined);

	const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
		const [state, dispatch] = useReducer(reducer, initialState);

		const store: Store<T> = useMemo(
			() => ({
				getState: (schema: Schema) =>
					(schema ? (state as T)[schema] : state) as Partial<T>,
			}),
			[state],
		);

		const proxyStore = useMemo(
			() =>
				new Proxy(store, {
					get(target: Store<T>, prop: string | number | symbol) {
						const propString = String(prop);
						console.log('Accessing property ' + propString);
						return target.getState(propString as keyof T);
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
