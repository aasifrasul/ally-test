import React from 'react';

interface ContextProviderProps {
	children: React.ReactNode;
}

interface ReducerAction {
	type: string;
	payload?: any;
}

type ReducerType = (state: any, action: ReducerAction) => any;

export const GenericContext = React.createContext({});

const { Provider } = GenericContext;

export const contextProviderFactory = (
	props: ContextProviderProps,
	Reducer: ReducerType,
	initialState: any = {},
) => {
	const [state, dispatch] = React.useReducer(Reducer, initialState);
	const value = React.useMemo(() => [state, dispatch], [state]);

	return <Provider value={value}>{props.children}</Provider>;
};
