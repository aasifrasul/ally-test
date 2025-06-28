import { useCallback, useEffect, useRef } from 'react';
import { useIntersectionObserver } from '../useIntersectionObserver';

interface UseInfiniteScrollProps {
	scrollRef: React.RefObject<HTMLElement>;
	callback: () => void;
	enabled?: boolean; // Add option to disable
}

export const useInfiniteScroll = ({
	scrollRef,
	callback,
	enabled = true,
}: UseInfiniteScrollProps): void => {
	const callbackRef = useRef(callback);
	const cleanupRef = useRef<(() => void) | undefined>(null);

	// Keep callback ref current
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	const handleIntersection: IntersectionObserverCallback = useCallback(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && enabled) {
					callbackRef.current();
				}
			});
		},
		[enabled],
	);

	const observe = useIntersectionObserver({
		threshold: 0,
		rootMargin: '100px', // Reduced from 2000px - that's excessive
		onIntersect: handleIntersection,
	});

	const cleanup = () => {
		if (cleanupRef.current) {
			cleanupRef.current();
			cleanupRef.current = null;
		}
	};

	useEffect(() => {
		// Cleanup previous observation
		cleanup();

		if (enabled && scrollRef.current) {
			cleanupRef.current = observe(scrollRef.current);
		}

		// Cleanup on unmount or when dependencies change
		return () => cleanup();
	}, [observe, scrollRef, enabled]);
};
