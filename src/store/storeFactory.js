import React, { createContext, useReducer, useMemo } from 'react';

import useContextFactory from '../Context/useContextFactory';

function storeFactory(reducer, initialState) {
	const storeContext = createContext();
	const dispatchContext = createContext();

	const StoreProvider = ({ children }) => {
		let [store, dispatch] = useReducer(reducer, initialState);
		[store, dispatch] = useMemo(() => [store, dispatch], [store, dispatch]);

		return (
			<dispatchContext.Provider value={dispatch}>
				<storeContext.Provider value={store}>{children}</storeContext.Provider>
			</dispatchContext.Provider>
		);
	};

	const useStore = useContextFactory('dispatchContext.Provider', storeContext);
	const useDispatch = useContextFactory('dispatchContext.Provider', dispatchContext);

	return [StoreProvider, useStore, useDispatch];
}

export default storeFactory;
