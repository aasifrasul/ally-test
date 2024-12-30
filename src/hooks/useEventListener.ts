import { useEffect, useRef, useCallback } from 'react';
import { createLogger, LogLevel, Logger } from '../utils/logger';

type EventMap = WindowEventMap & HTMLElementEventMap & DocumentEventMap;
type Target = Window | Document | HTMLElement | null | undefined;
type Options = boolean | AddEventListenerOptions;

interface ErrorHandlingOptions {
	onError?: (error: Error) => void;
	suppressErrors?: boolean;
}

const logger: Logger = createLogger('useEventListener', {
	level: LogLevel.DEBUG,
});

export function useEventListener<K extends keyof EventMap = keyof EventMap>(
	eventType: K,
	callback: (event: EventMap[K]) => void,
	element: Target,
	options?: Options,
	errorHandling: ErrorHandlingOptions = {},
): void {
	const callbackRef = useRef(callback);
	const optionsRef = useRef(options);
	const errorHandlingRef = useRef(errorHandling);

	// Update refs when dependencies change
	useEffect(() => {
		callbackRef.current = callback;
		optionsRef.current = options;
		errorHandlingRef.current = errorHandling;
	}, [callback, options, errorHandling]);

	// Memoize the event handler
	const eventHandler = useCallback((event: Event) => {
		try {
			if (callbackRef.current) {
				callbackRef.current(event as EventMap[K]);
			}
		} catch (error) {
			const err =
				error instanceof Error ? error : new Error('Unknown error in event handler');
			logger.error('Error in event handler:', err);

			if (errorHandlingRef.current.onError) {
				errorHandlingRef.current.onError(err);
			}

			if (!errorHandlingRef.current.suppressErrors) {
				throw err;
			}
		}
	}, []);

	useEffect(() => {
		if (!element) {
			logger.debug('No target element provided, skipping event listener attachment');
			return;
		}

		try {
			// Check if the event type is supported
			if (typeof element.addEventListener !== 'function') {
				throw new Error('Target element does not support event listeners');
			}

			logger.debug(`Attaching ${eventType} listener to element`, {
				element,
				options: optionsRef.current,
			});
			element.addEventListener(eventType, eventHandler, optionsRef.current);

			return () => {
				logger.debug(`Removing ${eventType} listener from element`);
				element.removeEventListener(eventType, eventHandler, optionsRef.current);
			};
		} catch (error) {
			const err =
				error instanceof Error ? error : new Error('Failed to attach event listener');
			logger.error('Error setting up event listener:', err);

			if (errorHandlingRef.current.onError) {
				errorHandlingRef.current.onError(err);
			}

			if (!errorHandlingRef.current.suppressErrors) {
				throw err;
			}
		}
	}, [eventType, element, eventHandler]);
}

/**
// Convenience hooks for common use cases
export function useWindowEventListener<K extends keyof WindowEventMap>(
	eventType: K,
	callback: (event: WindowEventMap[K]) => void,
	options?: Options,
	errorHandling?: ErrorHandlingOptions
): void {
	useEventListener(
		eventType,
		callback,
		typeof window !== 'undefined' ? window : undefined,
		options,
		errorHandling
	);
}

export function useDocumentEventListener<K extends keyof DocumentEventMap>(
	eventType: K,
	callback: (event: DocumentEventMap[K]) => void,
	options?: Options,
	errorHandling?: ErrorHandlingOptions
): void {
	useEventListener(
		eventType,
		callback,
		typeof document !== 'undefined' ? document : undefined,
		options,
		errorHandling
	);
}

const MyComponent: React.FC = () => {
	const elementRef = useRef<HTMLDivElement>(null);

	useEventListener(
		'click',
		(event) => {
			// Your event handling logic
		},
		elementRef.current,
		{ passive: true },
		{
			onError: (error) => {
				// Custom error handling
				console.error('Event listener failed:', error);
				// Maybe show a toast notification
			},
			suppressErrors: true, // Prevent errors from crashing the app
		}
	);

	return <div ref={elementRef}>Click me</div>;
};
*/
