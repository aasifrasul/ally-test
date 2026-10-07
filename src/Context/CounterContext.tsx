import { createContext, Dispatch, ReactNode, SetStateAction, useState } from 'react';

import { createContextProvider } from './contextProviderFactory';

export interface CounterContextType {
	count: number;
	setCount: Dispatch<SetStateAction<number>>;
}

export const CounterContext = createContext<CounterContextType>({
	count: 0,
	setCount: () => {},
});

export function createCounterContext(): [
	React.FC<{ children?: ReactNode; value: CounterContextType }>,
	() => CounterContextType,
] {
	return createContextProvider(CounterContext, 'CounterProvider');
}

export const [CounterContextProvider, useCounterContextContext] = createCounterContext();

export const CounterProvider = ({ children }: { children: ReactNode }) => {
	const [count, setCount] = useState<number>(0);
	const value = { count, setCount };

	return <CounterContextProvider value={value}>{children}</CounterContextProvider>;
};

export const useCounterContext = () => {
	const context = useCounterContextContext();
	if (!context) {
		throw new Error('useCounterContext must be used within a CounterProvider');
	}
	return context;
};
