import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useEventListener } from './EventListeners';

const DEFAULT_OVERSCAN = 3;

/**
 * Configuration options for the virtualization hook.
 */
interface VirtualizationOptions<T> {
	/**
	 * Complete dataset to virtualize.
	 */
	items: T[];

	/**
	 * Fixed height of each row/item in pixels.
	 *
	 * IMPORTANT:
	 * All items must have the same height.
	 */
	itemHeight: number;

	/**
	 * Number of extra rows rendered above and below
	 * the visible viewport.
	 *
	 * Helps prevent flickering during fast scrolling.
	 *
	 * @default 3
	 */
	overscan?: number;

	/**
	 * Render function for a single item.
	 *
	 * IMPORTANT:
	 * Use stable keys inside your rendered elements.
	 *
	 * BAD:
	 * key={index}
	 *
	 * GOOD:
	 * key={item.id}
	 */
	renderItem: (item: T, index: number) => React.ReactNode;
}

/**
 * Values returned by the virtualization hook.
 */
interface VirtualizationResult {
	/**
	 * Attach to the scrollable container element.
	 */
	containerRef: React.RefObject<HTMLDivElement | null>;

	/**
	 * The currently visible virtualized content.
	 */
	visibleContent: React.ReactNode[];

	/**
	 * Total scrollable height of the full dataset.
	 *
	 * Used to preserve native scrollbar behavior.
	 */
	totalHeight: number;

	/**
	 * Vertical offset for the rendered window.
	 *
	 * Applied using translateY().
	 */
	offsetY: number;

	/**
	 * First rendered item index.
	 */
	startIndex: number;

	/**
	 * Last rendered item index.
	 */
	endIndex: number;
}

/**
 * A lightweight fixed-size virtualization hook for large lists.
 *
 * Features:
 * - Fixed-height virtualization
 * - Overscanning
 * - Resize-aware viewport measurement
 * - requestAnimationFrame scroll throttling
 * - Memoized visible window rendering
 *
 * Best suited for:
 * - Infinite scrolling feeds
 * - Tables
 * - Large datasets
 * - Chat/message lists
 *
 * Limitations:
 * - Assumes ALL rows have identical heights
 * - Does not support dynamic row measurement
 *
 * Example:
 *
 * ```tsx
 * const {
 *   containerRef,
 *   visibleContent,
 *   totalHeight,
 *   offsetY,
 * } = useVirtualization({
 *   items,
 *   itemHeight: 50,
 *   renderItem: (item) => (
 *     <div key={item.id}>{item.name}</div>
 *   ),
 * });
 * ```
 */
export function useVirtualization<T>({
	items,
	itemHeight,
	overscan = DEFAULT_OVERSCAN,
	renderItem,
}: VirtualizationOptions<T>): VirtualizationResult {
	/**
	 * Ref attached to the scrollable container.
	 */
	const containerRef: React.RefObject<HTMLDivElement | null> = useRef(null);

	/**
	 * Current scroll position.
	 *
	 * Scroll drives virtualization window updates.
	 */
	const [scrollTop, setScrollTop] = useState(0);

	/**
	 * Viewport height is intentionally stored in a ref
	 * to avoid unnecessary rerenders during resize events.
	 */
	const viewportHeightRef = useRef(0);

	/**
	 * Used to throttle scroll updates using requestAnimationFrame.
	 */
	const frameRef = useRef<number | null>(null);

	/**
	 * Keeps latest renderItem reference stable without
	 * invalidating memoized content on parent rerenders.
	 */
	const renderItemRef = useRef(renderItem);

	useLayoutEffect(() => {
		renderItemRef.current = renderItem;
	});

	/**
	 * Updates viewport measurements.
	 */
	const updateViewport = useCallback(() => {
		const el = containerRef.current;

		if (!el) return;

		viewportHeightRef.current = el.clientHeight;

		/**
		 * Sync scroll position during initial mount
		 * and resize recalculations.
		 */
		setScrollTop(el.scrollTop);
	}, []);

	useLayoutEffect(() => {
		const el = containerRef.current;

		if (!el) return;

		updateViewport();

		/**
		 * Scroll handler throttled via requestAnimationFrame.
		 *
		 * Prevents excessive React updates during rapid scrolling.
		 */
		const handleScroll = () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
			}

			frameRef.current = requestAnimationFrame(() => {
				frameRef.current = null;

				setScrollTop(el.scrollTop);
			});
		};

		/**
		 * Tracks container size changes.
		 */
		const resizeObserver = new ResizeObserver(() => {
			updateViewport();
		});

		resizeObserver.observe(el);

		el.addEventListener('scroll', handleScroll, {
			passive: true,
		});

		return () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
			}

			resizeObserver.disconnect();

			el.removeEventListener('scroll', handleScroll);
		};
	}, [updateViewport]);

	/**
	 * Safe to read ref during render because
	 * viewportHeightRef is synchronized in layout effects.
	 */
	const viewportHeight = viewportHeightRef.current;

	/**
	 * Total scrollable height of all items combined.
	 */
	const totalHeight = items.length * itemHeight;

	/**
	 * First visible item index.
	 */
	const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);

	/**
	 * Last visible item index.
	 */
	const endIndex = Math.min(
		items.length,
		Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan,
	);

	/**
	 * Vertical translation offset for rendered rows.
	 */
	const offsetY = startIndex * itemHeight;

	/**
	 * Memoized visible window rendering.
	 */
	const visibleContent = useMemo(() => {
		const slice = items.slice(startIndex, endIndex);

		return slice.map((item, i) => renderItemRef.current(item, startIndex + i));
	}, [items, startIndex, endIndex]);

	return {
		containerRef,
		visibleContent,
		totalHeight,
		offsetY,
		startIndex,
		endIndex,
	};
}
