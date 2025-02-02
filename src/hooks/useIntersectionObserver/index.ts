import { useCallback, useRef } from 'react';

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
	const observedElements = useRef<Set<Element>>(new Set());

	const unobserve = useCallback((element: Element) => {
		if (observerRef.current && element) {
			observerRef.current.unobserve(element);
			observedElements.current.delete(element);
		}
	}, []);

	const observe = useCallback(
		(element: Element | null) => {
			if (!element || observedElements.current.has(element)) {
				return () => unobserve(element!);
			}

			if (!observerRef.current) {
				observerRef.current = new IntersectionObserver(onIntersect, {
					threshold,
					rootMargin,
					root,
				});
			}

			observerRef.current.observe(element);
			observedElements.current.add(element);

			return () => unobserve(element);
		},
		[onIntersect, rootMargin, threshold, root, unobserve],
	);

	return observe;
};
