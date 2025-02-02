import { useState, useEffect, useMemo } from 'react';

import { safelyExecuteFunction, isUndefined } from '../utils/typeChecking';

interface MutationObserverConfig {
	attributes?: boolean;
	childList?: boolean;
	subtree?: boolean;
	attributeOldValue?: boolean;
	characterData?: boolean;
	characterDataOldValue?: boolean;
}

type MutationCallback = (mutationList: MutationRecord[], observer: MutationObserver) => void;

function useMutationObserver(
	targetNode: Node | null,
	config: MutationObserverConfig,
	callback: MutationCallback,
): any {
	const [value, setValue] = useState<any>(undefined);

	const moCallback = () =>
		new MutationObserver((mutationList, observer) => {
			const result = safelyExecuteFunction(callback, null, mutationList, observer);
			setValue(result);
		});

	const memoizedMOCallback = useMemo(moCallback, [callback]);

	useEffect(() => {
		if (targetNode) {
			memoizedMOCallback.observe(targetNode, config);
		}
		return () => memoizedMOCallback.disconnect();
	}, [targetNode, config]);

	return value;
}

function useMutationObserverOnce(
	targetNode: Node | null,
	config: MutationObserverConfig,
	callback: MutationCallback,
): any {
	const [isObserving, setObserving] = useState(true);
	const node = isObserving ? targetNode : null;
	const value = useMutationObserver(node, config, callback);
	if (!isUndefined(value) && isObserving) {
		setObserving(false);
	}
	return value;
}

export { useMutationObserver, useMutationObserverOnce };
