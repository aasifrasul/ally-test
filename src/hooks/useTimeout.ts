import { useCallback, useEffect, useRef } from 'react';

export function useTimeout() {
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const cancel = useCallback(() => {
		if (timeout.current) {
			clearTimeout(timeout.current);
			timeout.current = null;
		}
	}, []);

	const set = useCallback((callback: () => void, delay: number) => {
		cancel();
		timeout.current = setTimeout(callback, delay);
	}, []);

	useEffect(() => cancel(), [cancel]);

	return { set, cancel };
}
