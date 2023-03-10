import React, { useRef } from 'react';

function usePersistentCallback(cb) {
	const callbackRef = useRef(cb);

	callbackRef.current = cb;

	const persistentCallbackRef = useRef((...args) => callbackRef.current(...args));

	return callbackRef.current;
}

export default usePersistentCallback;
