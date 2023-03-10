import React, { useContext } from 'react';

const useContextFactory = (name, context) => {
	return () => {
		const ctx = useContext(context);
		if (ctx) {
			return ctx;
		}
		throw new Error(`useContext must be used withing a ${name}.`);
	};
};

export default useContextFactory;
