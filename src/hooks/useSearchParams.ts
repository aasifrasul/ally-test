import { useState, useEffect, useCallback } from 'react';
import { useEventListener } from './';
import { isEmpty, isUndefined } from '../utils/typeChecking';

export function useSearchParams() {
	const [searchParams, setSearchParams] = useState<URLSearchParams>(() =>
		isUndefined(window)
			? new URLSearchParams()
			: new URLSearchParams(window.location?.search),
	);

	const handlePopState = useCallback((event: Event): void => {
		const popStateEvent = event as PopStateEvent;
		const newParams = new URLSearchParams(
			popStateEvent.state?.searchParams || window.location.search,
		);
		setSearchParams(newParams);
	}, []) as EventListener;

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
				isEmpty(params[key])
					? newParams.delete(key)
					: newParams.set(key, params[key] as string);
			}

			return newParams;
		});
	}, []);

	return { getPageURL, getParamByKey, searchParams, setSearchParams, updateParams };
}
