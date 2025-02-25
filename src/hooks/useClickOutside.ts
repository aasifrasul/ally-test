import { useCallback, useRef, RefObject } from 'react';
import { useEventListener } from './EventListeners/useEventListener';
import useToggle from './useToggle';

type EventType =
	| 'mousedown'
	| 'mouseup'
	| 'click'
	| 'touchstart'
	| 'touchend'
	| 'mouseover'
	| 'mouseout'
	| 'mouseenter'
	| 'mouseleave';

interface UseClickOutside<T> {
	isOutsideClick: boolean;
	outsideRef: RefObject<T>;
}

type ElementRef =
	| HTMLElement
	| HTMLDivElement
	| HTMLInputElement
	| HTMLButtonElement
	| HTMLTextAreaElement
	| HTMLSelectElement
	| null;

const useClickOutside = <T extends ElementRef = ElementRef>(
	initialState: boolean = false,
	eventType: EventType = 'mousedown', // Or 'pointerdown' for combined mouse/touch
): UseClickOutside<T> => {
	const [isOutsideClick, setIsOutsideClick] = useToggle(initialState);
	const outsideRef = useRef<T>(null);

	const handleClickOutside = useCallback(
		(event: Event): void => {
			if (outsideRef.current && event.target instanceof Element) {
				setIsOutsideClick(!outsideRef.current.contains(event.target));
			} else if (outsideRef.current) {
				setIsOutsideClick(true); // If no target element and there is a ref, its an outside click
			}
		},
		[setIsOutsideClick],
	);

	useEventListener(eventType, handleClickOutside, document);

	return { isOutsideClick, outsideRef };
};

export default useClickOutside;
