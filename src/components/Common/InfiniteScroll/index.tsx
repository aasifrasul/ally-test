import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Spinner } from '../Spinner';

interface Props {
	/**
	 * Whether there is more data to load.
	 * When `false`, the IntersectionObserver is disconnected and no further
	 * `loadMore` calls will be made.
	 */
	hasMore: boolean;

	/**
	 * Async function that fetches the next page of data.
	 * Called automatically when the sentinel element enters the viewport.
	 * Does not need to be memoized — the component keeps a ref to the latest
	 * version so the observer is never recreated due to a new function reference.
	 */
	loadMore: () => Promise<void>;

	/**
	 * Margin around the root viewport used to trigger the observer early.
	 * A positive value (e.g. `'200px'`) means `loadMore` fires before the
	 * sentinel is fully visible, giving smoother perceived performance.
	 * Defaults to `'200px'`.
	 */
	rootMargin?: string;
}

/**
 * `InfiniteScroll` wraps any list of `children` and automatically calls
 * `loadMore` as the user scrolls toward the bottom, using an
 * `IntersectionObserver` to watch a zero-size sentinel element placed after
 * the children.
 *
 * ## Key design decisions
 *
 * - **`isFetchingRef`** — a ref (not state) guards against concurrent fetches
 *   without triggering re-renders.
 * - **`loadMoreRef`** — always points to the latest `loadMore` prop so the
 *   callback stays stable (`[]` dep array) and never forces the observer to
 *   reconnect due to a new function reference from the parent.
 * - **`hasMoreRef`** — mirrors the `hasMore` prop inside the callback so the
 *   callback itself has an empty dep array. The `useEffect` that sets up the
 *   observer still depends on `hasMore` directly, so the observer is properly
 *   disconnected when there is nothing left to load.
 * - **`try / finally`** — guarantees `isFetchingRef` and `showLoader` are
 *   always reset even if `loadMore` throws.
 *
 * ## Usage
 *
 * ```tsx
 * <InfiniteScroll hasMore={hasNextPage} loadMore={fetchNextPage}>
 *   {items.map(item => <Row key={item.id} {...item} />)}
 * </InfiniteScroll>
 * ```
 *
 * `loadMore` does **not** need to be wrapped in `useCallback` on the consumer
 * side; the component handles that internally.
 */
export function InfiniteScroll({
	children,
	hasMore,
	loadMore,
	rootMargin = '200px',
}: React.PropsWithChildren<Props>) {
	const [showLoader, setShowLoader] = useState(false);

	/** Prevents concurrent in-flight fetches without causing re-renders. */
	const isFetchingRef = useRef(false);

	/** Zero-size element whose visibility triggers `loadMore`. */
	const sentinelRef = useRef<HTMLDivElement>(null);

	/**
	 * Always holds the latest `loadMore` reference.
	 * Updated synchronously in a layout-like effect so it is current before
	 * any intersection fires.
	 */
	const loadMoreRef = useRef(loadMore);
	useEffect(() => {
		loadMoreRef.current = loadMore;
	}, [loadMore]);

	/**
	 * Mirrors `hasMore` inside a ref so `handleIntersection` can read the
	 * current value without being listed as a dependency (which would force
	 * the observer to reconnect on every `hasMore` change).
	 */
	const hasMoreRef = useRef(hasMore);
	useEffect(() => {
		hasMoreRef.current = hasMore;
	}, [hasMore]);

	/**
	 * Stable intersection callback (empty dep array — all mutable values are
	 * accessed through refs).
	 *
	 * Fires when the sentinel enters or leaves the viewport. Only acts when:
	 * 1. The sentinel is intersecting (entering, not leaving).
	 * 2. There is more data to load (`hasMoreRef`).
	 * 3. A fetch is not already in progress (`isFetchingRef`).
	 */
	const handleIntersection = useCallback<IntersectionObserverCallback>(
		(entries) => {
			const entry = entries[0];
			if (!entry?.isIntersecting || !hasMoreRef.current || isFetchingRef.current) {
				return;
			}

			const fetchMore = async () => {
				try {
					isFetchingRef.current = true;
					setShowLoader(true);
					await loadMoreRef.current();
				} finally {
					// Always reset, even if `loadMore` throws, to prevent a deadlock
					// where the spinner shows forever and no further loads are possible.
					isFetchingRef.current = false;
					setShowLoader(false);
				}
			};

			void fetchMore();
		},
		[], // stable — all values read via refs
	);

	/**
	 * Creates and cleans up the `IntersectionObserver`.
	 *
	 * Re-runs when `hasMore`, `rootMargin`, or `handleIntersection` changes.
	 * When `hasMore` becomes `false` the effect returns early, which triggers
	 * the cleanup function and disconnects the observer.
	 */
	useEffect(() => {
		const node = sentinelRef.current;
		if (!node || !hasMore) return;

		const observer = new IntersectionObserver(handleIntersection, {
			rootMargin,
			threshold: 0, // fire as soon as any part of the sentinel is visible
		});

		observer.observe(node);
		return () => observer.disconnect();
	}, [hasMore, rootMargin, handleIntersection]);

	return (
		<>
			{children}
			{/* Sentinel: zero-size, positioned after the last child */}
			<div ref={sentinelRef} />
			{showLoader && <Spinner size={24} />}
		</>
	);
}
