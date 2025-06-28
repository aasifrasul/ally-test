import { useCallback, useEffect, useRef } from 'react';

interface UseIntersectionObserverProps {
	threshold?: number | number[];
	rootMargin?: string;
	root?: Element | null;
	onIntersect: IntersectionObserverCallback;
}

export const useIntersectionObserver = ({
	threshold = 0,
	rootMargin = '0px',
	root = null,
	onIntersect,
}: UseIntersectionObserverProps) => {
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Create observer with current callback
	const createObserver = useCallback(() => {
		if (observerRef.current) {
			observerRef.current.disconnect();
		}
		observerRef.current = new IntersectionObserver(onIntersect, {
			threshold,
			rootMargin,
			root,
		});
		return observerRef.current;
	}, [onIntersect, threshold, rootMargin, root]);

	const observe = useCallback(
		(element: Element | null) => {
			if (!element) return;

			const observer = observerRef.current || createObserver();
			observer.observe(element);

			// Return cleanup function
			return () => {
				observer.unobserve(element);
			};
		},
		[createObserver],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
		};
	}, []);

	return observe;
};
