import { useEffect, useRef } from 'react';
import { useDocumentEventListener, useWindowEventListener } from '../';
import { isObject, isUndefined } from '../../utils/typeChecking';
import { startPolling } from './helpers';

interface RefetchLifecycleOptions {
	enabled: boolean;
	interval?: number;
	isStale: () => boolean;
	refetch: () => void | Promise<void>;
}

export function useRefetchLifecycle({
	enabled,
	interval,
	isStale,
	refetch,
}: RefetchLifecycleOptions): void {
	const isStaleRef = useRef(isStale);
	const refetchRef = useRef(refetch);

	isStaleRef.current = isStale;
	refetchRef.current = refetch;

	const refetchIfStale = () => {
		if (isStaleRef.current()) refetchRef.current();
	};

	useWindowEventListener(
		'focus',
		() => {
			if (!enabled) return;
			if (!isUndefined(document) && document.visibilityState === 'hidden') return;
			refetchIfStale();
		},
		undefined,
		{ suppressErrors: true },
	);

	useDocumentEventListener(
		'visibilitychange',
		() => {
			if (!enabled) return;
			if (isObject(document) && document.visibilityState === 'hidden') return;
			refetchIfStale();
		},
		undefined,
		{ suppressErrors: true },
	);

	useEffect(() => {
		const intervalId = startPolling(interval, refetchIfStale);
		return () => {
			if (!isUndefined(window) && intervalId !== undefined) {
				window.clearInterval(intervalId);
			}
		};
	}, [interval]);
}
