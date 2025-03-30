import { createContext, Dispatch, ReactNode, SetStateAction, useState } from 'react';

import useContextFactory from './useContextFactory';

export interface CounterContextType {
	count: number;
	setCount: Dispatch<SetStateAction<number>>;
}

// Create Context Object
export const CounterContext = createContext<CounterContextType>({
	count: 0,
	setCount: () => {},
});

const CounterContextProvider = (props: { children: ReactNode }) => {
	const [count, setCount] = useState<number>(0);

	return (
		<CounterContext.Provider value={{ count, setCount }}>
			{props.children}
		</CounterContext.Provider>
	);
};

const useCounterContext = useContextFactory('CounterContextProvider', CounterContext);

export { CounterContextProvider, useCounterContext };
