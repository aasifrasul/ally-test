import { useRef, useEffect } from 'react';

import { isFunction } from '../utils/typeChecking';

interface Callback<T> {
	(dependencies: T): void;
}

interface Condition<T> {
	(dependencies: T): boolean;
}

const useEffectOnlyOnce = <T>(
	callback: Callback<T>,
	dependencies: T,
	condition?: Condition<T>,
) => {
	const hasExecuted = useRef(false);

	useEffect(() => {
		if (hasExecuted.current) {
			return;
		}

		if (isFunction(condition) && condition(dependencies)) {
			isFunction(callback) && callback(dependencies);
			hasExecuted.current = true;
		}

		return () => {
			// Cleanup logic if needed
		};
	}, [dependencies]);
};

export default useEffectOnlyOnce;
