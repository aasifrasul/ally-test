import React from 'react';

import { useFetchStore } from '../../Context/dataFetchContext';

import { safeExecute } from '../../utils/typeChecking';

function useSelector(callback) {
	const { store } = useFetchStore();
	return safeExecute(callback, null, store);
}

export default useSelector;
