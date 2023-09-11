import React, { useCallback, useEffect } from 'react';

import { safelyExecuteFunction } from '../../utils/typeChecking';

const useInfiniteScrollIO = (scrollRef, callback) => {
	const ioCallback = (entries) =>
		entries.forEach(
			(entry) => entry.intersectionRatio > 0 && safelyExecuteFunction(callback)
		);

	const scrollObserver = (node) => {
		const ioObject = new IntersectionObserver(ioCallback, {
			root: null,
			rootMargin: '2000px',
			threshold: 0,
		});
		ioObject.observe(node);
	};

	const memoizedScrollObserver = useCallback(scrollObserver, [scrollRef]);

	useEffect(() => {
		scrollRef && memoizedScrollObserver(scrollRef);
		return () => scrollRef && (scrollRef = null);
	}, [memoizedScrollObserver, scrollRef]);
};

export default useInfiniteScrollIO;
