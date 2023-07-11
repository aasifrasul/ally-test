import React, { useState, useEffect, useMemo } from 'react';

import { safelyExecuteFunction, isUndefined } from '../utils/typeChecking';

function useMutationObserver(targetNode, config, callback) {
	const [value, setValue] = useState(undefined);

	const moCallback = () =>
		new MutationObserver((mutationList, observer) => {
			const result = safelyExecuteFunction(callback, null, mutationList, observer);
			setValue(result);
		});

	const memoizedMOCallback = useMemo(moCallback, [callback]);

	useEffect(() => {
		targetNode && memoizedMOCallback.observe(targetNode, config);
		return () => memoizedMOCallback.disconnect();
	}, [targetNode, config]);

	return value;
}

function useMutationObserverOnce(targetNode, config, callback) {
	const [isObserving, setObserving] = useState(true);
	const node = isObserving ? targetNode : null;
	const value = useMutationObserver(node, config, callback);
	if (!isUndefined(value) && isObserving) {
		setObserving(false);
	}
	return value;
}

export { useMutationObserver, useMutationObserverOnce };
