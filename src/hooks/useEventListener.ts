import { useEffect, useRef } from 'react';
import { createLogger, LogLevel, Logger } from '../utils/logger';

type EventMap = WindowEventMap & HTMLElementEventMap & DocumentEventMap;

type Target = Window | Document | HTMLElement | null | undefined;

type Options = boolean | AddEventListenerOptions;

const logger = createLogger('APIService', {
	level: LogLevel.DEBUG,
});

export function useEventListener<K extends keyof EventMap = keyof EventMap>(
	eventType: K,
	callback: (event: EventMap[K]) => void,
	element: Target,
	options?: Options,
): void {
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	useEffect(() => {
		if (!element) {
			logger.debug('No target element provided, skipping event listener attachment');
			return;
		}

		const listener: EventListener = (event) => callbackRef.current(event as EventMap[K]);

		element.addEventListener(eventType, listener, options);

		return () => {
			element.removeEventListener(eventType, listener, options);
		};
	}, [eventType, element, options]);
}

/*
// Example usage for global events
export function useWindowEventListener<K extends keyof WindowEventMap>(
	eventType: K,
	callback: (event: WindowEventMap[K]) => void,
	options?: Options,
): void {
	useEventListener(
		eventType,
		callback,
		typeof window !== 'undefined' ? window : undefined,
		options,
	);
}

// Example Usage with TypeScript
import React, { useRef, useState } from 'react';
import { useEventListener } from './useEventListener';

interface MousePosition {
	x: number;
	y: number;
}

const MouseTracker: React.FC = () => {
	const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
	const trackingAreaRef = useRef<HTMLDivElement>(null);

	useEventListener(
		'mousemove',
		(event: MouseEvent) => {
			setPosition({ x: event.clientX, y: event.clientY });
		},
		trackingAreaRef.current
	);

	return (
		<div ref={trackingAreaRef} style={{ height: '200px', border: '1px solid black' }}>
			Mouse position: {position.x}, {position.y}
		</div>
	);
};

// Example with keyboard events
const KeyboardListener: React.FC = () => {
	const [lastKey, setLastKey] = useState<string>('');

	useEventListener('keydown', (event: KeyboardEvent) => {
		setLastKey(event.key);
	});

	return <div>Last key pressed: {lastKey}</div>;
};
*/
