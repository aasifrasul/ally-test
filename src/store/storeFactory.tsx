import React, { ReactNode } from 'react';

import { createStoreContext } from './createStore';
import { GenericReducer, GenericState, StoreContextValue } from '../constants/types';

function storeFactory<T extends GenericState>(
	reducer: GenericReducer,
	initialState: T,
): [React.FC<{ children: ReactNode }>, () => StoreContextValue<T>] {
	return createStoreContext(reducer, initialState, { name: 'StoreContext.Provider' });
}

export default storeFactory;
export { createStoreContext };
