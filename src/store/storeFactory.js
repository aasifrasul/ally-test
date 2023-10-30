import React, { createContext, useReducer, useMemo } from 'react';

import useContextFactory from '../Context/useContextFactory';

function storeFactory(reducer, initialState) {
	const storeContext = createContext();
	const store = {};

	const StoreProvider = ({ children }) => {
		const [state, dispatch] = useReducer(reducer, initialState);
		const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
		store.getState = (schema = null) => (schema in state ? state[schema] : state);
		delete value.state;
		value.store = store;

		return <storeContext.Provider value={value}>{children}</storeContext.Provider>;
	};

	const useStore = useContextFactory('dispatchContext.Provider', storeContext);

	return [StoreProvider, useStore];
}

export default storeFactory;
