import { useEffect, useRef } from 'react';

export function useTimeout() {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const cancel = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	};

	const set = (callback: () => void, delay: number) => {
		cancel();
		timeoutRef.current = setTimeout(callback, delay);
	};

	useEffect(() => cancel, []);

	return { set, cancel };
}
