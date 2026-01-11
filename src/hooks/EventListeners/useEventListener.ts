import { useEffect, useRef, useCallback } from 'react';
import { createLogger, LogLevel, Logger } from '../../utils/Logger';
import { ErrorHandlingOptions, Options, Target, EventMap } from './types';
import { isFunction } from '../../utils/typeChecking';
import { useCallbackRef } from '../';

const logger: Logger = createLogger('useEventListener', {
	level: LogLevel.DEBUG,
});

// Generic hook that supports single or multiple event types
export function useEventListener<K extends keyof EventMap>(
	eventType: K | K[],
	callback: EventListener | (() => void),
	element: Target,
	options?: Options,
	errorHandling?: ErrorHandlingOptions, // Removed default value
): void;

// Overload for mixed event types with broader signature
export function useEventListener(
	eventType: keyof EventMap | (keyof EventMap)[],
	callback: EventListener | (() => void),
	element: Target,
	options?: Options,
	errorHandling?: ErrorHandlingOptions,
): void;

export function useEventListener<K extends keyof EventMap>(
	eventType: K | K[],
	callback: EventListener | (() => void),
	element: Target,
	options?: Options,
	errorHandling: ErrorHandlingOptions = {},
): void {
	const callbackRef = useCallbackRef(callback);
	const optionsRef = useRef(options);
	optionsRef.current = options;
	const errorHandlingRef = useRef(errorHandling);
	errorHandlingRef.current = errorHandling;

	useEffect(() => {
		optionsRef.current = options;
		errorHandlingRef.current = errorHandling;
	}, [callback, options, errorHandling]);

	const handleError = useCallback((message: string, error: unknown): void => {
		const err = error instanceof Error ? error : new Error(message);
		logger.error(message, err);
		errorHandlingRef.current.onError?.(err);
		if (!errorHandlingRef.current.suppressErrors) {
			throw err;
		}
	}, []);

	// Use useCallback with a generic event type K
	const eventHandler = useCallback(
		(event: Event): void => {
			try {
				// call via any to allow both EventListener and no-arg callbacks
				(callbackRef.current as any)?.(event);
			} catch (error) {
				handleError('Unknown error in event handler', error);
			}
		},
		[handleError],
	);

	useEffect(() => {
		if (!element || !callback) {
			logger.debug('No target element or callback provided');
			return;
		}

		if (!isFunction((element as any).addEventListener)) {
			handleError('Target element does not support event listeners', null);
			return;
		}

		const types = Array.isArray(eventType) ? eventType : [eventType];

		logger.debug(`Attaching listeners: ${types.join(', ')}`, {
			element,
			options: optionsRef.current,
		});

		types.forEach((type) => {
			// Cast the element to a more specific type to satisfy the compiler
			(element as EventTarget).addEventListener(
				type,
				eventHandler as EventListenerOrEventListenerObject,
				optionsRef.current,
			);
		});

		return () => {
			logger.debug(`Removing listeners: ${types.join(', ')}`);
			types.forEach((type) => {
				(element as EventTarget).removeEventListener(
					type,
					eventHandler as EventListenerOrEventListenerObject,
					optionsRef.current,
				);
			});
		};
	}, [eventType, element, callback, eventHandler, handleError]);
}

/**
// Convenience hooks for common use cases

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
