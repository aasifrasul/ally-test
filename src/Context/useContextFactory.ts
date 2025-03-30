import React, { useContext } from 'react';

/**
 * Custom hook factory for safely consuming React context.
 *
 * @template T The type of the context value.
 * @param {string} name The name of the context provider for error messages.
 * @param {React.Context<T>} context The React context to consume.
 * @returns {() => T} A custom hook that returns the context value or throws an error.
 */
const useContextFactory = <T>(name: string, context: React.Context<T>): (() => T) => {
	return () => {
		const ctx: T = useContext(context);
		if (ctx) {
			return ctx;
		}
		throw new Error(
			`useContext must be used within a ${name}; Please check the Component hierarchy`,
		);
	};
};

export default useContextFactory;
