import React, { useCallback, useEffect } from 'react';

import { safelyExecuteFunction } from '../../utils/typeChecking';

const useInfiniteScrollIO = (scrollRef, callback) => {
	const ioCallback = (entries) =>
		entries.forEach((entry) => entry.isIntersecting && safelyExecuteFunction(callback));

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
		scrollRef?.current && memoizedScrollObserver(scrollRef.current);
		return () => scrollRef?.current && (scrollRef.current = null);
	}, [memoizedScrollObserver, scrollRef]);
};

export default useInfiniteScrollIO;
