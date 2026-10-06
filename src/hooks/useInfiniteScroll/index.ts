import { useCallback, useEffect, useRef, RefObject } from 'react';
import { useIntersectionObserver } from '../useIntersectionObserver';
import { useCallbackRef } from '../useCallbackRef';

interface UseInfiniteScrollProps {
	/**
	 * Reference to the sentinel element being observed.
	 *
	 * Typically placed at the bottom of a list or container.
	 */
	sentinelRef: RefObject<HTMLElement | null>;

	/**
	 * Callback triggered when more data should be loaded.
	 */
	callback: () => void;

	/**
	 * Enables or disables infinite scrolling.
	 *
	 * Useful for temporarily pausing auto-loading behavior.
	 *
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * Indicates whether data is currently being loaded.
	 *
	 * Prevents duplicate callback execution while
	 * a request is already in progress.
	 *
	 * @default false
	 */
	isLoading?: boolean;

	/**
	 * Indicates whether additional pages/data are available.
	 *
	 * When `false`, further loading is prevented.
	 *
	 * @default true
	 */
	hasNextPage?: boolean;
}

/**
 * React hook for implementing infinite scrolling using
 * `IntersectionObserver`.
 *
 * Features:
 * - Prevents duplicate fetches during loading.
 * - Stops loading when no more pages exist.
 * - Automatically retries when loading finishes and the
 *   sentinel is still visible.
 * - Uses stable callback refs to avoid unnecessary observer recreation.
 *
 * Typical use cases:
 * - Paginated APIs
 * - Infinite feeds
 * - Lazy-loading list/grid content
 *
 * @example
 * ```tsx
 * const sentinelRef = useRef<HTMLDivElement>(null);
 *
 * useInfiniteScroll({
 *   sentinelRef: sentinelRef,
 *   callback: fetchNextPage,
 *   isLoading,
 *   hasNextPage,
 * });
 *
 * return <div ref={sentinelRef} />;
 * ```
 */
export const useInfiniteScroll = ({
	sentinelRef,
	callback,
	enabled = true,
	isLoading = false,
	hasNextPage = true,
}: UseInfiniteScrollProps): void => {
	/**
	 * Stable reference to the latest callback.
	 */
	const callbackRef = useCallbackRef(callback);

	/**
	 * Stable reference to current loading eligibility logic.
	 */
	const canLoadRef = useCallbackRef(() => enabled && !isLoading && hasNextPage);

	/**
	 * Tracks whether the sentinel element is currently intersecting.
	 *
	 * Used to retry loading once `isLoading` changes back to false.
	 */
	const isIntersectingRef = useRef(false);

	/**
	 * IntersectionObserver callback.
	 *
	 * Triggers loading when:
	 * - sentinel is visible
	 * - loading is allowed
	 */
	const handleIntersection: IntersectionObserverCallback = useCallback(([entry]) => {
		isIntersectingRef.current = entry?.isIntersecting ?? false;

		if (isIntersectingRef.current && canLoadRef.current()) {
			callbackRef.current();
		}
	}, []);

	/**
	 * Re-check loading conditions after loading completes.
	 *
	 * This handles the case where:
	 * - the sentinel remained visible
	 * - observer did not retrigger automatically
	 */
	useEffect(() => {
		if (isIntersectingRef.current && enabled && !isLoading && hasNextPage) {
			callbackRef.current();
		}
	}, [isLoading, enabled, hasNextPage]);

	/**
	 * Create observer with preloading margin.
	 *
	 * `rootMargin` allows fetching slightly before
	 * the sentinel fully enters the viewport.
	 */
	const observe = useIntersectionObserver({
		threshold: 0,
		rootMargin: '200px',
		onIntersect: handleIntersection,
	});

	/**
	 * Observe the sentinel element.
	 */
	useEffect(() => {
		const el = sentinelRef.current;

		if (!el) return;

		const unobserve = observe(el);

		return () => unobserve?.();
	}, [observe, sentinelRef]);
};
