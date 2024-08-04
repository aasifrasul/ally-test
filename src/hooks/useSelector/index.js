import React from 'react';

import { useFetchStore } from '../../Context/dataFetchContext';

import { safelyExecuteFunction } from '../../utils/typeChecking';

function useSelector(callback) {
	const { store } = useFetchStore();
	return safelyExecuteFunction(callback, null, store);
}

export default useSelector;
