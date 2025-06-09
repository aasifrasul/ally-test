'use client';
import { useCallback, useRef, RefObject } from 'react';
import { useEventListener } from './EventListeners/useEventListener';
import { useToggle } from './useToggle';

type EventType =
	| 'mousedown'
	| 'mouseup'
	| 'click'
	| 'touchstart'
	| 'touchend'
	| 'pointerdown'
	| 'pointerup' // Better for modern touch handling
	| 'mouseover'
	| 'mouseout'
	| 'mouseenter'
	| 'mouseleave';

type ElementRef =
	| HTMLElement
	| HTMLDivElement
	| HTMLInputElement
	| HTMLButtonElement
	| HTMLTextAreaElement
	| HTMLSelectElement
	| HTMLUListElement
	| null;

interface UseClickOutside<T extends ElementRef> {
	isOutsideClick: boolean;
	outsideRef: RefObject<T | null>;
}

export const useClickOutside = <T extends ElementRef = ElementRef>(
	initialState: boolean = false,
	eventType: EventType = 'mousedown', // Or 'pointerdown' for combined mouse/touch
): UseClickOutside<T> => {
	const [isOutsideClick, setIsOutsideClick] = useToggle(initialState);
	const outsideRef = useRef<T>(null);

	const handleClickOutside = useCallback(
		(event: Event): void => {
			// No ref to check against, do nothing
			if (!outsideRef.current) return;

			if (event.target instanceof Element) {
				setIsOutsideClick(!outsideRef.current.contains(event.target));
			} else {
				setIsOutsideClick(true);
			}
		},
		[setIsOutsideClick],
	);

	useEventListener(eventType, handleClickOutside, globalThis.document);

	return { isOutsideClick, outsideRef };
};
