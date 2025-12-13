import { useState, useEffect, useCallback } from 'react';
import { useEventListener } from './';

export function useSearchParams() {
	const [searchParams, setSearchParams] = useState<URLSearchParams>(
		() => new URLSearchParams(window.location?.search),
	);

	const handlePopState: (event: PopStateEvent) => void = useCallback(
		(event: PopStateEvent): void => {
			const newParams = new URLSearchParams(
				event.state?.searchParams || window.location.search,
			);
			setSearchParams(newParams);
		},
		[],
	);

	useEventListener('popstate', handlePopState, window);

	const getPageURL = useCallback((): string => {
		const q = searchParams.toString();
		return q ? `${window.location.pathname}?${q}` : window.location.pathname;
	}, [searchParams]);

	useEffect(() => {
		window.history.replaceState(
			{ searchParams: searchParams.toString() },
			'',
			getPageURL(),
		);
	}, [searchParams, getPageURL]);

	const getParamByKey = (key: string): string => (key ? searchParams.get(key) || '' : '');

	const updateParams = useCallback((params: Record<string, string | null>) => {
		setSearchParams((prevParams) => {
			const newParams = new URLSearchParams(prevParams);

			for (const key in params) {
				if (!key) continue;
				params[key] === null
					? newParams.delete(key)
					: newParams.set(key, params[key] as string);
			}

			return newParams;
		});
	}, []);

	return { getPageURL, getParamByKey, searchParams, setSearchParams, updateParams };
}
