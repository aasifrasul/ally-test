import { useEffect, useRef } from 'react';

import ScrollToTop from '../Common/ScrollToTopButton';

import { InitialState } from '../../constants/types';
import { ISProps } from '../../types/infiniteScroll';

import UserCard from './UserCard';

import './InfiniteScroll.css';

import { useVirtualization } from '../../hooks/useVirtualization';

type Props = Omit<InitialState, 'data'> & ISProps;

/**
 * InfiniteScroll
 *
 * A virtualized infinite-scroll list of user cards.
 *
 * Architecture overview:
 *
 *   ┌─ scrollable container (ref: containerRef) ──────────────┐
 *   │  ┌─ totalHeight spacer (position: relative) ──────────┐ │
 *   │  │  ┌─ translateY(offsetY) ──────────────────────────┐ │ │
 *   │  │  │  visibleContent (only rendered rows)           │ │ │
 *   │  │  └────────────────────────────────────────────────┘ │ │
 *   │  └────────────────────────────────────────────────────┘ │
 *   │  <div ref={sentinelRef} />  ← 1px trigger at list end   │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Virtualization:
 *   Only the rows currently in the viewport (+ overscan) are
 *   mounted in the DOM. A full-height spacer preserves the native
 *   scrollbar, and translateY positions the rendered window at the
 *   correct scroll offset.
 *
 * Infinite scroll trigger:
 *   An IntersectionObserver watches a 1px sentinel div placed
 *   immediately after the spacer in normal flow. It is scoped to
 *   the scroll container (root) and fires 300px before the sentinel
 *   is actually reached (rootMargin), giving the fetch time to
 *   complete before the user hits the bottom.
 *
 *   A ref-based loading guard (isFetchingRef) prevents duplicate
 *   requests while a fetch is already in flight.
 *
 *   currentPage is mirrored into a ref (currentPageRef) so the
 *   observer closure always reads the latest value without needing
 *   to be re-created on every page increment.
 *
 * Props:
 *   currentPage  – current pagination index (1-based)
 *   fetchNextPage – callback that receives the next page number
 *   TOTAL_PAGES  – total number of pages available
 *   data         – flat array of user objects for the current fetch
 */
export const InfiniteScroll = (props: Props) => {
	const { currentPage = 1, fetchNextPage, TOTAL_PAGES, data } = props;

	// ─── Refs ────────────────────────────────────────────────────────────────

	/**
	 * 1px div placed in normal flow just after the virtual-list spacer.
	 * Observed by IntersectionObserver to trigger pagination.
	 */
	const sentinelRef = useRef<HTMLDivElement>(null);

	/**
	 * Guards against duplicate fetches while a request is in-flight.
	 * Using a ref instead of state avoids triggering a re-render when
	 * the flag flips.
	 */
	const isFetchingRef = useRef(false);

	/**
	 * Mirrors currentPage into a ref so the IntersectionObserver
	 * callback always has the latest value without being recreated
	 * on every page change.
	 */
	const currentPageRef = useRef(currentPage);

	useEffect(() => {
		currentPageRef.current = currentPage;
	}, [currentPage]);

	// ─── Virtualization ───────────────────────────────────────────────────────

	const { containerRef, visibleContent, totalHeight, offsetY } = useVirtualization({
		items: data ?? [],

		/**
		 * All UserCard rows are fixed at 100px.
		 * This must match the height set on the wrapper div below.
		 */
		itemHeight: 100,

		renderItem: (user) => (
			/**
			 * key must be stable and unique — never use array index here.
			 * Prefer `login.uuid` from the API which is stable for each user.
			 */
			<div key={user.login.uuid ?? user.email ?? user.id?.value} style={{ height: 100 }}>
				<UserCard data={user} data-testid="user-details" />
			</div>
		),
	});

	// ─── Intersection observer (infinite scroll trigger) ──────────────────────

	useEffect(() => {
		const sentinel = sentinelRef.current;
		const container = containerRef.current;

		if (!sentinel || !container) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				// Only fire when the sentinel enters the visible area.
				if (!entry.isIntersecting) return;

				// Bail if a fetch is already in-flight.
				if (isFetchingRef.current) return;

				// Bail if all pages have been loaded.
				if (TOTAL_PAGES != null && currentPageRef.current >= TOTAL_PAGES) return;

				isFetchingRef.current = true;

				Promise.resolve(fetchNextPage(currentPageRef.current + 1)).finally(() => {
					isFetchingRef.current = false;
				});
			},
			{
				/**
				 * Scope the observer to the scroll container, not the
				 * browser viewport. Without this the sentinel may fire
				 * immediately or never depending on page layout.
				 */
				root: container,

				/**
				 * Trigger 300px before the sentinel is actually reached.
				 * This gives the fetch time to complete before the user
				 * hits the bottom, producing a seamless loading experience.
				 */
				rootMargin: '300px',
			},
		);

		observer.observe(sentinel);

		return () => observer.disconnect();

		/**
		 * TOTAL_PAGES and fetchNextPage are stable references that
		 * define the observer's behaviour. currentPage is intentionally
		 * omitted — it is read via currentPageRef to avoid recreating
		 * the observer on every page increment.
		 */
	}, [TOTAL_PAGES, fetchNextPage, containerRef]);

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="scrollParent">
			<h1 className="text-3xl text-center mt-4 mb-10">All users</h1>

			<ScrollToTop />

			{/*
			 * Scroll container — must have a fixed height and overflow: auto.
			 * containerRef is attached here by useVirtualization.
			 */}
			<div
				ref={containerRef}
				style={{
					height: 500,
					overflow: 'auto',
				}}
			>
				{/*
				 * Full-height spacer preserves the native scrollbar height
				 * so it correctly represents the entire dataset, not just
				 * the small number of currently rendered rows.
				 */}
				<div
					style={{
						height: totalHeight,
						position: 'relative',
					}}
				>
					{/*
					 * Shift the rendered window to its correct scroll position.
					 * willChange: 'transform' promotes this layer to the GPU,
					 * avoiding layout reflows on every scroll frame.
					 */}
					<div
						style={{
							transform: `translateY(${offsetY}px)`,
							willChange: 'transform',
						}}
					>
						{visibleContent}
					</div>
				</div>

				{/*
				 * Sentinel — a 1px div in normal flow placed just after
				 * the spacer. The IntersectionObserver watches this element
				 * to know when the user is approaching the bottom of the list.
				 *
				 * Placed OUTSIDE the spacer so it sits in normal flow at the
				 * true end of the scroll content, not inside the relative
				 * container where positioning math would be needed.
				 */}
				<div ref={sentinelRef} style={{ height: 1 }} />
			</div>

			{/* End-of-list indicator shown once all pages are loaded. */}
			{currentPage === TOTAL_PAGES && <p className="text-center my-10">♥</p>}
		</div>
	);
};
