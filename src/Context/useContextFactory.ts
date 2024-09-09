import React, { useContext } from 'react';

const useContextFactory = (name: string, context: React.Context<any>) => {
	return () => {
		const ctx = useContext(context);
		if (ctx) {
			return ctx;
		}
		throw new Error(`useContext must be used within a ${name}`);
	};
};

export default useContextFactory;
