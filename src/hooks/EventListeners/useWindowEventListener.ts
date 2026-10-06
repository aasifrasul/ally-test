import { useEventListener } from './useEventListener';
import { ErrorHandlingOptions, Options } from './types';
import { isUndefined } from '../../utils/typeChecking';

export function useWindowEventListener<K extends keyof WindowEventMap>(
	eventType: K,
	callback: (event: WindowEventMap[K]) => void,
	options?: Options,
	errorHandling?: ErrorHandlingOptions,
): void {
	useEventListener(
		eventType,
		callback as unknown as EventListener,
		!isUndefined(window) ? window : undefined,
		options,
		errorHandling,
	);
}
