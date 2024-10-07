import { useEffect, useRef } from 'react';

type EventMap = WindowEventMap & HTMLElementEventMap & DocumentEventMap;

type Target = Window | Document | HTMLElement;

type Options = boolean | AddEventListenerOptions;

export function useEventListener<
	T extends Target = Window,
	K extends keyof EventMap = keyof EventMap,
>(
	eventType: K,
	callback: (event: EventMap[K]) => void,
	element?: T | null,
	options?: Options,
): void {
	// Create a ref that stores the callback
	const callbackRef = useRef(callback);

	// Update callback ref whenever callback changes
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	useEffect(() => {
		// If no element is provided and window is not available, return early
		const targetElement: T | null =
			element ?? (typeof window !== 'undefined' ? (window as unknown as T) : null);

		if (!targetElement?.addEventListener) {
			return;
		}

		// Create event listener that calls callback function stored in ref
		const listener: typeof callback = (event) => callbackRef.current(event);

		targetElement.addEventListener(eventType, listener, options);

		// Remove event listener on cleanup
		return () => {
			targetElement.removeEventListener(eventType, listener, options);
		};
	}, [eventType, element, options]);
}

/*
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
