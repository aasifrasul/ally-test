import { useState, useEffect, useCallback, useRef } from 'react';
import { useEventListener } from './EventListeners';

export function useSearchParams() {
	const [searchParams, setSearchParamsState] = useState<URLSearchParams>(() =>
		typeof window !== 'undefined'
			? new URLSearchParams(window.location.search)
			: new URLSearchParams(),
	);

	// Use ref to track if we're updating from internal state vs external navigation
	const isInternalUpdate = useRef(false);

	const setSearchParams = useCallback(
		(
			newParamsOrUpdater: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
		) => {
			isInternalUpdate.current = true;
			setSearchParamsState(newParamsOrUpdater);
		},
		[],
	);

	// Update URL whenever searchParams changes
	useEffect(() => {
		if (isInternalUpdate.current) {
			const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
			window.history.replaceState({ searchParams: searchParams.toString() }, '', newUrl);
			isInternalUpdate.current = false;
		}
	}, [searchParams]);

	const handlePopState = useCallback((event: PopStateEvent) => {
		const newParams = new URLSearchParams(
			event.state?.searchParams || window.location.search,
		);
		// Don't trigger URL update for popstate events
		isInternalUpdate.current = false;
		setSearchParamsState(newParams);
	}, []);

	useEventListener('popstate', handlePopState, window);

	const updateParams = useCallback(
		(params: Record<string, string>) => {
			setSearchParams((prevParams: URLSearchParams) => {
				const newParams = new URLSearchParams(prevParams);
				Object.entries(params).forEach(([key, value]) => {
					if (key.length > 0) {
						newParams.set(key, value);
					}
				});
				return newParams;
			});
		},
		[setSearchParams],
	);

	const getPageURL = useCallback(
		(): string => `${window.location.pathname}?${searchParams.toString()}`,
		[searchParams],
	);

	return { searchParams, setSearchParams, updateParams, getPageURL };
}
