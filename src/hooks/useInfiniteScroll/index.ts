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
	const canLoadRef = useCallbackRef(() => enabled && !isLoading && hasNextPage);
	// Re-check when loading finishes in case sentinel is already visible
	const isIntersectingRef = useRef(false);

	const handleIntersection: IntersectionObserverCallback = useCallback((entries) => {
		const target = entries[0];
		isIntersectingRef.current = target?.isIntersecting ?? false;

		if (isIntersectingRef.current && canLoadRef.current()) {
			callbackRef.current();
		}
	}, []);

	useEffect(() => {
		if (isIntersectingRef.current && enabled && !isLoading && hasNextPage) {
			callbackRef.current();
		}
	}, [isLoading, enabled, hasNextPage]);

	const observe = useIntersectionObserver({
		threshold: 0,
		rootMargin: '200px', // Slightly larger margin often feels smoother
		onIntersect: handleIntersection,
	});

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;

		const unobserve = observe(el);
		return () => unobserve?.();
	}, [observe, scrollRef]);
};
