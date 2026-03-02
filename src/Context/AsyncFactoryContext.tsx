import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { PromiseFactory, PromiseFactoryOptions } from '../utils/PromiseFactory';

// Create the context
const AsyncFactoryContext = createContext<PromiseFactory<any> | null>(null);

interface AsyncProviderProps {
	children: React.ReactNode;
	options?: Partial<PromiseFactoryOptions>;
}

export const AsyncProvider: React.FC<AsyncProviderProps> = ({ children, options }) => {
	// We use useMemo so the factory instance is stable for the app's lifetime
	const factory = useMemo(() => new PromiseFactory(options), []);

	// Cleanup when the app unmounts
	useEffect(() => {
		return () => factory.dispose();
	}, [factory]);

	return (
		<AsyncFactoryContext.Provider value={factory}>{children}</AsyncFactoryContext.Provider>
	);
};

/**
 * Internal hook to grab the factory safely
 */
export function useAsyncFactory<T = any>() {
	const context = useContext(AsyncFactoryContext);
	if (!context) {
		throw new Error('useAsyncFactory must be used within an AsyncProvider');
	}
	return context as PromiseFactory<T>;
}
