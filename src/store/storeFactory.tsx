import React, { createContext, useReducer, useMemo, ReactNode, Reducer, Context } from 'react';
import useContextFactory from '../Context/useContextFactory';

type AnyObject = Record<string, any>;

interface Store<T extends AnyObject> {
	getState: (schema?: keyof T | null) => Partial<T>;
}

interface StoreContextValue<T extends AnyObject> {
	dispatch: React.Dispatch<any>;
	store: Store<T>;
}

function storeFactory<T extends AnyObject>(
	reducer: Reducer<T, any>,
	initialState: T,
): [React.FC<{ children: ReactNode }>, () => StoreContextValue<T>] {
	const StoreContext = createContext<StoreContextValue<T> | undefined>(undefined);

	const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
		const [state, dispatch] = useReducer(reducer, initialState);

		const store: Store<T> = useMemo(
			() => ({
				getState: (schema = null) => (state?.[schema] || state) as Partial<T>,
			}),
			[state],
		);

		const proxyStore = useMemo(
			() =>
				new Proxy(store, {
					get(target, prop: string) {
						console.log('Accessing property ' + prop);
						return target.getState(prop as keyof T);
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
