import React, { useContext } from 'react';

const useContextFactory = <T>(name: string, context: React.Context<T>): Function => {
	return () => {
		const ctx: T = useContext(context);
		if (ctx) {
			return ctx;
		}
		throw new Error(`useContext must be used within a ${name}`);
	};
};

export default useContextFactory;
