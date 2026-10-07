import React, { createContext, useContext, useEffect, useMemo } from 'react';

import { createContextProvider } from './contextProviderFactory';
import { PromiseFactory, PromiseFactoryOptions } from '../utils/PromiseFactory';

// Create the context
export const AsyncFactoryContext = createContext<PromiseFactory<any> | null>(null);

export function createAsyncContext<T = any>(): [
	React.FC<{ children?: React.ReactNode; value: PromiseFactory<T> }>,
	() => PromiseFactory<T>,
] {
	return createContextProvider(
		AsyncFactoryContext as React.Context<PromiseFactory<T>>,
		'AsyncProvider',
	);
}

interface AsyncProviderProps {
	children: React.ReactNode;
	options?: Partial<PromiseFactoryOptions>;
}

export const [AsyncContextProvider, useAsyncContext] = createAsyncContext();

export const AsyncProvider: React.FC<AsyncProviderProps> = ({ children, options }) => {
	const factory = useMemo(() => new PromiseFactory(options), []);

	useEffect(() => {
		return () => factory.dispose();
	}, [factory]);

	return <AsyncContextProvider value={factory}>{children}</AsyncContextProvider>;
};

export function useAsyncFactory<T = any>() {
	const context = useContext(AsyncFactoryContext);
	if (!context) {
		throw new Error('useAsyncFactory must be used within an AsyncProvider');
	}
	return context as PromiseFactory<T>;
}
