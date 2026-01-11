import { useCallback, useEffect, useRef } from 'react';

export function useTimers() {
	const timeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

	const cancel = useCallback((id?: ReturnType<typeof setTimeout>) => {
		if (id) {
			clearTimeout(id);
			timeouts.current.delete(id);
		} else {
			// Cancel all
			timeouts.current.forEach(clearTimeout);
			timeouts.current.clear();
		}
	}, []);

	const set = useCallback(
		(callback: () => void, delay: number) => {
			const id = setTimeout(() => {
				callback();
				timeouts.current.delete(id);
			}, delay);
			timeouts.current.add(id);
			return () => cancel(id);
		},
		[cancel],
	);

	useEffect(() => () => cancel(), [cancel]);

	return { set, cancel };
}
