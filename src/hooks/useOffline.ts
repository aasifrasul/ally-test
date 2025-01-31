import { useCallback, useState } from 'react';
import { useEventListener } from './EventListeners/useEventListener';

export function useOffline(): boolean {
	const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

	const onOnline = useCallback(() => setIsOffline(false), []);
	const onOffline = useCallback(() => setIsOffline(true), []);

	useEventListener('offline', onOffline, window);
	useEventListener('online', onOnline, window);

	return isOffline;
}
