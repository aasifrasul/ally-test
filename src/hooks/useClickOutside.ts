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
	eventType: EventType = 'mousedown',
): UseClickOutside<T> => {
	const [isOutsideClick, setIsOutsideClick] = useToggle(initialState);
	const outsideRef = useRef<T>(null);

	const handleClickOutside = useCallback(
		(event: Event) => {
			if (outsideRef.current && !outsideRef.current.contains(event.target as Node)) {
				setIsOutsideClick(true);
			} else {
				setIsOutsideClick(false);
			}
		},
		[setIsOutsideClick],
	);

	useEventListener(eventType, handleClickOutside, document);

	return { isOutsideClick, outsideRef };
};

export default useClickOutside;
