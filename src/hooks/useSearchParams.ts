import { useState, useEffect, useCallback, useRef } from 'react';
import { useEventListener } from './EventListeners';

export function useSearchParams() {
	const [isInitialized, setIsInitialized] = useState(false);
	// Initialize with current URL search params
	const [searchParams, setSearchParams] = useState<URLSearchParams>(
		new URLSearchParams((window as Window & typeof globalThis).location.search),
	);

	useEventListener('popstate', handlePopState, window as Window & typeof globalThis);

	useEffect(() => {
		setSearchParams(
			new URLSearchParams((window as Window & typeof globalThis).location.search),
		);
	}, []);

	const getPageURL = useCallback(
		(): string =>
			`${(window as Window & typeof globalThis).location.pathname}?${searchParams.toString()}`,
		[searchParams],
	);

	useEffect(() => {
		if (!isInitialized) {
			setIsInitialized(true);
			return;
		}

		(window as Window & typeof globalThis).history.replaceState(
			{ searchParams: searchParams.toString() },
			'',
			getPageURL(),
		);
	}, [searchParams, getPageURL, isInitialized]);

	function handlePopState(event: PopStateEvent) {
		// Get params from event state if available, otherwise from URL
		const newParams = new URLSearchParams(
			event.state?.searchParams ||
				(window as Window & typeof globalThis).location.search,
		);
		setSearchParams(newParams);
	}

	// Convenience method to update parameters
	const updateParams = useCallback(
		(params: Record<string, string | null>) => {
			setSearchParams((prevParams: URLSearchParams): URLSearchParams => {
				const newParams: URLSearchParams = new URLSearchParams(prevParams);
				for (const key in params) {
					if (key.length === 0) continue;
					params[key] === null
						? newParams.delete(key)
						: newParams.set(key, params[key] as string);
				}
				return newParams;
			});
		},
		[setSearchParams],
	);

	return { searchParams, setSearchParams, updateParams, getPageURL };
}
