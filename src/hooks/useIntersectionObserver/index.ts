import { useCallback, useEffect, useRef } from 'react';

interface UseIntersectionObserverProps {
	/**
	 * Percentage of target visibility at which the callback fires.
	 * @default 0
	 */
	threshold?: number | number[];
	/**
	 * Margin around the root used to grow or shrink the intersection area.
	 * Useful for pre-loading before an element enters the viewport.
	 * @default '0px'
	 */
	rootMargin?: string;
	/**
	 * Element used as the viewport. Defaults to the browser viewport.
	 * @default null
	 */
	root?: Element | null;
	/**
	 * Called whenever intersection state changes. Stored in a ref internally
	 * so the observer is never recreated due to callback identity changes.
	 */
	onIntersect: IntersectionObserverCallback;
}

/**
 * Manages a single reusable IntersectionObserver.
 *
 * Returns an `observe(element)` function that begins observing the element and
 * returns a cleanup callback that unobserves it.
 *
 * @example
 * const observe = useIntersectionObserver({
 *   threshold: 0.5,
 *   onIntersect: ([entry]) => {
 *     if (entry.isIntersecting) doSomething();
 *   },
 * });
 *
 * useEffect(() => observe(ref.current), [observe]);
 */
export const useIntersectionObserver = ({
	threshold = 0,
	rootMargin = '0px',
	root = null,
	onIntersect,
}: UseIntersectionObserverProps) => {
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Keep the callback ref fresh so the observer never needs to be recreated
	// just because the callback's identity changed.
	const onIntersectRef = useRef(onIntersect);
	useEffect(() => {
		onIntersectRef.current = onIntersect;
	});

	// Recreate the observer only when structural options change.
	const getObserver = useCallback(() => {
		if (observerRef.current) return observerRef.current;

		observerRef.current = new IntersectionObserver(
			(entries, observer) => onIntersectRef.current(entries, observer),
			{ threshold, rootMargin, root },
		);

		return observerRef.current;
	}, [threshold, rootMargin, root]);

	const observe = useCallback(
		(element: Element | null) => {
			if (!element) return;
			const observer = getObserver();
			observer.observe(element);
			return () => observer.unobserve(element);
		},
		[getObserver],
	);

	useEffect(() => {
		return () => {
			observerRef.current?.disconnect();
			observerRef.current = null;
		};
	}, []);

	return observe;
};
