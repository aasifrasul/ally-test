import React from 'react';

import { useFetchStore } from '../../Context/dataFetchContext';

function useSelector(callback) {
	const { store, dispatch } = useFetchStore();
	const result = callback(store);
	result.dispatch = dispatch;

	return result;
}

export default useSelector;
