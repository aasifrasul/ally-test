import React, { useState, createContext } from 'react';

import useContextFactory from './useContextFactory';

// Create a provider for components to consume and subscribe to changes
interface CounterContextProviderProps {
	children: React.ReactNode;
}

interface CounterContextType {
	count: number;
	setCount: React.Dispatch<React.SetStateAction<number>>;
}

// Create Context Object
export const CounterContext = createContext({});

const { Provider } = CounterContext;

const CounterContextProvider: React.FC<CounterContextProviderProps> = (props) => {
	const [count, setCount] = useState<number>(0);

	return <Provider value={{ count, setCount }}>{props.children}</Provider>;
};

const useCounterContext = useContextFactory('CounterContextProvider', CounterContext);

export { CounterContextProvider, useCounterContext };
