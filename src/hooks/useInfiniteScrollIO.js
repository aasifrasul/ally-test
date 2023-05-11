import React, { useCallback, useEffect } from 'react';

import { safelyExecuteFunction } from '../utils/typeChecking';

const useInfiniteScrollIO = (scrollRef, callback) => {
	const scrollObserver = useCallback(
		() =>
			new IntersectionObserver(
				(entries) =>
					entries.forEach(
						(entry) => entry.isIntersecting && safelyExecuteFunction(callback),
					),
				{
					root: null,
					rootMargin: '2000px',
					threshold: 0,
				},
			).observe(scrollRef?.current),
		[scrollRef?.current],
	);

	useEffect(() => {
		scrollObserver();
		return () => scrollRef?.current && (scrollRef.current = null);
	}, [scrollObserver, scrollRef]);
};

export default useInfiniteScrollIO;
