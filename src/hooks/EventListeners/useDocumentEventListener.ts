import { useEventListener } from './useEventListener';
import { ErrorHandlingOptions, Options } from './types';
import { isUndefined } from '../../utils/typeChecking';

export function useDocumentEventListener<K extends keyof DocumentEventMap>(
	eventType: K,
	callback: (event: DocumentEventMap[K]) => void,
	options?: Options,
	errorHandling?: ErrorHandlingOptions,
): void {
	useEventListener(
		eventType,
		callback as unknown as EventListener,
		!isUndefined(document) ? document : undefined,
		options,
		errorHandling,
	);
}
