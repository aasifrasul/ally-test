import { useEffect, useRef } from 'react';

interface UseIntervalCallback {
	(): void;
}

interface UseInterval {
	(callback: UseIntervalCallback, delay?: number): void;
}

export const useInterval: UseInterval = (callback, delay = 0) => {
	const callbackRef = useRef<UseIntervalCallback>(callback);

	// Remember the latest callback.
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		const tick = () => callbackRef.current!();
		const id = setInterval(tick, delay);
		return () => clearInterval(id);
	}, [delay]);
};
