import React, { PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

export function renderWithProviders(
	ui,
	{
		preloadedState = {},
		store = configureStore({ reducer: { user: userReducer }, preloadedState }),
		...renderOptions
	} = {}
) {
	function Wrapper({ children }) {
		return <Provider store={store}>{children}</Provider>;
	}

	return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
