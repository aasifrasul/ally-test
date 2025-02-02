import { useCallback, useEffect } from 'react';
import { useIntersectionObserver } from '../useIntersectionObserver';

interface UseInfiniteScrollProps {
	scrollRef: HTMLElement | null;
	callback: () => void;
}

export const useInfiniteScroll = ({ scrollRef, callback }: UseInfiniteScrollProps): void => {
	const handleIntersection: IntersectionObserverCallback = useCallback(
		(entries, observer) => {
			entries.forEach((entry) => {
				if (entry.intersectionRatio > 0) {
					callback();
				}
			});
		},
		[callback],
	);

	const observe = useIntersectionObserver({
		threshold: 0,
		rootMargin: '2000px',
		onIntersect: handleIntersection,
	});

	useEffect(() => {
		if (scrollRef) {
			observe(scrollRef);
		}
	}, [observe, scrollRef]);
};
