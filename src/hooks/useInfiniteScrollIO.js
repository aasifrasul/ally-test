import React, { useCallback, useEffect } from 'react';

import { safelyExecuteFunction } from '../utils/typeChecking';

const useInfiniteScrollIO = (scrollRef, callback) => {
	const scrollObserver = useCallback(
		(node) =>
			new IntersectionObserver(
				(entries) => entries.forEach((entry) => entry.isIntersecting && safelyExecuteFunction(callback)),
				{
					root: null,
					rootMargin: '2000px',
					threshold: 0,
				},
			).observe(node),
		[scrollRef],
	);

	useEffect(() => {
		scrollRef?.current && scrollObserver(scrollRef.current);
		return () => scrollRef?.current && (scrollRef.current = null);
	}, [scrollObserver, scrollRef]);
};

export default useInfiniteScrollIO;
