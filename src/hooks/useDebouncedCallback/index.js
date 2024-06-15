import React, { useRef, useCallback } from 'react';

import { debounce } from 'src/utils/throttleAndDebounce';

export const useDebouncedCallback = (callback, delay) => {
	const callbackRef = useRef();
	callbackRef.current = callback;
	return useCallback(
		debounce((...args) => callbackRef.current(...args), delay),
		[],
	);
};
