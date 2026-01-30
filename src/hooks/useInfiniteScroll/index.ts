import { useCallback, useEffect, useRef, RefObject } from 'react';
import { useIntersectionObserver } from '../useIntersectionObserver';
import { useCallbackRef } from '../useCallbackRef';

interface UseInfiniteScrollProps {
	scrollRef: RefObject<HTMLElement | null>;
	callback: () => void;
	enabled?: boolean;
	isLoading?: boolean; // Add loading state
	hasNextPage?: boolean; // Add end-of-data check
}

export const useInfiniteScroll = ({
	scrollRef,
	callback,
	enabled = true,
	isLoading = false,
	hasNextPage = true,
}: UseInfiniteScrollProps): void => {
	const callbackRef = useCallbackRef(callback);
	const cleanupRef = useRef<(() => void) | undefined>(null);

	const handleIntersection: IntersectionObserverCallback = useCallback(
		(entries) => {
			entries.forEach(({ isIntersecting }: { isIntersecting: boolean }) => {
				// Only trigger if:
				// 1. Element is intersecting
				// 2. Feature is enabled
				// 3. Not currently loading
				// 4. Has more pages to load
				if (isIntersecting && enabled && !isLoading && hasNextPage) {
					callbackRef.current();
				}
			});
		},
		[enabled, isLoading, hasNextPage],
	);

	const observe = useIntersectionObserver({
		threshold: 0,
		rootMargin: '100px',
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

		// Only observe if enabled and has more pages
		if (enabled && hasNextPage && scrollRef.current) {
			cleanupRef.current = observe(scrollRef.current);
		}

		// Cleanup on unmount or when dependencies change
		return () => cleanup();
	}, [observe, scrollRef, enabled, hasNextPage]);
};
