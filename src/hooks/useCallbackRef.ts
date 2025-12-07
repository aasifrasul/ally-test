import { useEffect, useRef } from 'react';

export function useCallbackRef<T extends (...args: any[]) => any>(
	callback: T,
): React.RefObject<T> {
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	return callbackRef;
}
