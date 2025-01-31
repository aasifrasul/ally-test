import { useEventListener } from './useEventListener';
import { ErrorHandlingOptions, Options } from './types';

export function useDocumentEventListener<K extends keyof DocumentEventMap>(
	eventType: K,
	callback: (event: DocumentEventMap[K]) => void,
	options?: Options,
	errorHandling?: ErrorHandlingOptions,
): void {
	useEventListener(
		eventType,
		callback,
		typeof document !== 'undefined' ? document : undefined,
		options,
		errorHandling,
	);
}
