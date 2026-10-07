import React from 'react';

import useContextFactory from './useContextFactory';

interface ContextProviderProps {
	children: React.ReactNode;
}

interface ReducerAction {
	type: string;
	payload?: any;
}

type ReducerType = (state: any, action: ReducerAction) => any;

export const GenericContext = React.createContext<any>(undefined);

export function createContextProvider<T>(
	context: React.Context<T>,
	name: string,
): [React.FC<{ children?: React.ReactNode; value: T }>, () => T] {
	const Provider = ({ children, value }: { children?: React.ReactNode; value: T }) =>
		React.createElement(context.Provider, { value }, children);

	Provider.displayName = name.replace(/\.Provider$/, '') + 'Provider';

	return [Provider, useContextFactory(name, context)];
}

export const contextProviderFactory = (
	props: ContextProviderProps,
	Reducer: ReducerType,
	initialState: any = {},
) => {
	const [state, dispatch] = React.useReducer(Reducer, initialState);
	const value = React.useMemo(() => [state, dispatch], [state, dispatch]);

	return React.createElement(GenericContext.Provider, { value }, props.children);
};
