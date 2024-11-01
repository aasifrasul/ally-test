import React, { PropsWithChildren, ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { configureStore, EnhancedStore, PreloadedState } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { userReducer } from './path/to/userReducer'; // Adjust the import path

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'queries'> {
	preloadedState?: PreloadedState<any>;
	store?: EnhancedStore;
}

export function renderWithProviders(
	ui: ReactElement,
	{
		preloadedState = {},
		store = configureStore({ reducer: { user: userReducer }, preloadedState }),
		...renderOptions
	}: RenderWithProvidersOptions = {},
) {
	function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
		return <Provider store={store}>{children}</Provider>;
	}

	return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
