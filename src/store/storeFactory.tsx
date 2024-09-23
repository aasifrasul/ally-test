import React, { createContext, useReducer, useMemo, ReactNode, Reducer } from 'react';

import { AnyObject, StoreContextValue, Store } from './types';

import useContextFactory from '../Context/useContextFactory';

function storeFactory<T extends AnyObject>(
	reducer: Reducer<T, any>,
	initialState: T,
): [React.FC<{ children: ReactNode }>, () => StoreContextValue<T>] {
	const StoreContext = createContext<StoreContextValue<T> | undefined>(undefined);

	const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
		const [state, dispatch] = useReducer(reducer, initialState);

		const store: Store<T> = useMemo(
			() => ({
				getState: (schema: keyof T | null = null) =>
					(schema ? state[schema] : state) as Partial<T>,
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
