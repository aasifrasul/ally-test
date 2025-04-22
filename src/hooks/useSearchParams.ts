import { useState, useEffect, useCallback } from 'react';

import { useEventListener } from './EventListeners';

export function useSearchParams() {
	// Initialize with current URL search params
	const [searchParams, setSearchParamsState] = useState<URLSearchParams>(
		new URLSearchParams(window.location.search),
	);

	useEventListener('popstate', handlePopState, window);

	// Wrapper for setSearchParams that accepts both direct value and callback
	const setSearchParams = useCallback(
		(
			newParamsOrUpdater: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
		) => {
			if (typeof newParamsOrUpdater === 'function') {
				setSearchParamsState((prev) => newParamsOrUpdater(prev));
			} else {
				setSearchParamsState(newParamsOrUpdater);
			}
		},
		[],
	);

	// Update URL whenever searchParams changes
	useEffect(() => {
		// Store the params string in the state object
		window.history.replaceState({ searchParams: getParamsString() }, '', getPageURL());
	}, [searchParams]);

	function handlePopState(event: PopStateEvent) {
		// Get params from event state if available, otherwise from URL
		const newParams = new URLSearchParams(
			event.state?.searchParams || window.location.search,
		);
		setSearchParamsState(newParams);
	}

	// Convenience method to update parameters
	const updateParams = useCallback(
		(params: Record<string, string>) => {
			setSearchParams((prevParams: URLSearchParams): URLSearchParams => {
				const newParams: URLSearchParams = new URLSearchParams(prevParams);
				for (const key in params) {
					if (key.length === 0) continue;
					newParams.set(key, params[key]);
				}
				return newParams;
			});
		},
		[setSearchParams],
	);

	const getParamsString = () => searchParams.toString();

	const getPageURL = (): string => `${window.location.pathname}?${getParamsString()}`;

	return { searchParams, setSearchParams, updateParams, getPageURL };
}
