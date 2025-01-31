import { useEventListener } from './useEventListener';
import { ErrorHandlingOptions, Options } from './types';

export function useWindowEventListener<K extends keyof WindowEventMap>(
	eventType: K,
	callback: (event: WindowEventMap[K]) => void,
	options?: Options,
	errorHandling?: ErrorHandlingOptions,
): void {
	useEventListener(
		eventType,
		callback,
		typeof window !== 'undefined' ? window : undefined,
		options,
		errorHandling,
	);
}
