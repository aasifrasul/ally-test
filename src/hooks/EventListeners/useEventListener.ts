'use client';
import { useEffect, useRef, useCallback } from 'react';
import { createLogger, LogLevel, Logger } from '../../utils/Logger';
import { ErrorHandlingOptions, Options, Target, EventMap } from './types';
import { isFunction } from '../../utils/typeChecking';

const logger: Logger = createLogger('useEventListener', {
	level: LogLevel.DEBUG,
});

// Generic hook that supports single or multiple event types
export function useEventListener<K extends keyof EventMap>(
	eventType: K | K[],
	callback: (event: EventMap[K]) => void,
	element: Target,
	options?: Options,
	errorHandling?: ErrorHandlingOptions, // Removed default value
): void;

// Overload for mixed event types with broader signature
export function useEventListener(
	eventType: keyof EventMap | (keyof EventMap)[],
	callback: (event: Event) => void,
	element: Target,
	options?: Options,
	errorHandling?: ErrorHandlingOptions,
): void;

export function useEventListener<K extends keyof EventMap>(
	eventType: K | K[],
	callback: (event: EventMap[K]) => void,
	element: Target,
	options?: Options,
	errorHandling: ErrorHandlingOptions = {},
): void {
	const callbackRef = useRef(callback);
	const optionsRef = useRef(options);
	const errorHandlingRef = useRef(errorHandling);

	useEffect(() => {
		callbackRef.current = callback;
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
		(event: EventMap[K]): void => {
			try {
				callbackRef.current?.(event);
			} catch (error) {
				handleError('Unknown error in event handler', error);
			}
		},
		[handleError],
	);

	useEffect(() => {
		if (!element) {
			logger.debug('No target element provided, skipping event listener attachment');
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
	}, [eventType, element, eventHandler, handleError]);
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
