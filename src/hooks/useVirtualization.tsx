import { JSX, useEffect, useState, useRef } from 'react';

import { useEventListener } from './EventListeners';

interface Item {
	text: string;
}

type Props = {
	className: string;
	itemHeight: number;
	items: Item[]; // Items are now a prop
};

export function useVirtualization({
	className,
	itemHeight = 50,
	items,
}: Props): JSX.Element[] | null {
	const containerRef = useRef<HTMLDivElement>(null);
	const [visibleItems, setVisibleItems] = useState<JSX.Element[]>([]);

	const renderVisibleItems = () => {
		if (!containerRef.current) return;

		const scrollTop = containerRef.current.scrollTop;
		const viewportHeight = containerRef.current.clientHeight;
		const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight)); // Prevent negative index
		const endIndex = Math.min(
			items.length,
			Math.ceil((scrollTop + viewportHeight) / itemHeight),
		); // Prevent index beyond array length

		const newVisibleItems = [];
		for (let i = startIndex; i < endIndex; i++) {
			const item = items[i];
			newVisibleItems.push(
				<div key={i} style={{ height: `${itemHeight}px` }}>
					{item.text}
				</div>,
			);
		}
		setVisibleItems(newVisibleItems);
	};

	useEventListener('scroll', renderVisibleItems, containerRef.current);

	useEffect(() => {
		renderVisibleItems();
	}, [items]); // Re-render when items change

	return visibleItems.length > 0 ? visibleItems : null; // Return the elements to be rendered or null if no items
}
