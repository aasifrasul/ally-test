import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Shape, Spinner } from '../Spinner';

interface Props {
	hasMore: boolean;
	loadMore: () => Promise<void>;
	rootMargin?: string;
}

export function InfiniteScroll({
	children,
	hasMore,
	loadMore,
	rootMargin = '0px',
}: React.PropsWithChildren<Props>) {
	const [showLoader, setShowLoader] = useState(false);
	const isFetching = useRef<boolean>(false);
	const sentinelRef = useRef<HTMLDivElement>(null);

	const handleIntersection = useCallback(
		async (entries: IntersectionObserverEntry[]) => {
			if (isFetching.current) {
				return;
			}
			if (entries[0]?.intersectionRatio !== 1) {
				return;
			}
			isFetching.current = true;
			setShowLoader(true);
			await loadMore();
			isFetching.current = false;
			setShowLoader(false);
		},
		[loadMore],
	);

	useEffect(() => {
		if (hasMore) {
			const observer = new IntersectionObserver(handleIntersection, {
				rootMargin,
			});
			observer.observe(sentinelRef.current as Element);
			return () => observer.disconnect();
		}
		return () => {};
	}, [hasMore, rootMargin, handleIntersection]);

	return (
		<>
			{children}
			<div ref={sentinelRef} />
			{showLoader && <Spinner shapeName={Shape.REGULAR_CIRCLE} size={24} />}
		</>
	);
}
