import React from 'react';

import storeFactory from '../store/storeFactory';

import ContactReducer from '../reducers/ContactReducer';

const initialState = {
	contacts: [
		{
			id: '098',
			name: 'Diana Prince',
			email: 'diana@us.army.mil',
		},
		{
			id: '099',
			name: 'Bruce Wayne',
			email: 'bruce@batmail.com',
		},
		{
			id: '100',
			name: 'Clark Kent',
			email: 'clark@metropolitan.com',
		},
	],
	loading: false,
	error: null,
};

const [ContactStoreProvider, useContactStore, useContactDispatch] = storeFactory(
	ContactReducer,
	initialState,
);

export { ContactStoreProvider, useContactStore, useContactDispatch };
