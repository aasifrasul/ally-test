import React, { createContext, useReducer, useMemo } from 'react';

import useContextFactory from '../Context/useContextFactory';

function storeFactory(reducer, initialState) {
	const storeContext = createContext();
	const store = {};

	const StoreProvider = ({ children }) => {
		const [state, dispatch] = useReducer(reducer, initialState);
		store.getState = () => state;

		return (
			<storeContext.Provider value={{ store, dispatch }}>
				{children}
			</storeContext.Provider>
		);
	};

	const useStore = useContextFactory('dispatchContext.Provider', storeContext);

	return [StoreProvider, useStore];
}

export default storeFactory;
