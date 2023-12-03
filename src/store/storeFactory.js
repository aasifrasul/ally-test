import React, { createContext, useReducer, useMemo } from 'react';

import useContextFactory from '../Context/useContextFactory';

function storeFactory(reducer, initialState) {
	const storeContext = createContext();
	const store = {};

	const StoreProvider = ({ children }) => {
		const [state, dispatch] = useReducer(reducer, initialState);
		const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
		store.getState = (schema = null) => (schema in state ? state[schema] : {});
		const handler = {
			get(target, prop) {
				console.log('Accessing property ' + prop);
				return store.getState(prop);
			},
		};

		const proxyStore = new Proxy(store, handler);

		delete value.state;
		value.store = proxyStore;

		return <storeContext.Provider value={value}>{children}</storeContext.Provider>;
	};

	const useStore = useContextFactory('dispatchContext.Provider', storeContext);

	return [StoreProvider, useStore];
}

export default storeFactory;
