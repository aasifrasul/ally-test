import { useCallback, useRef, RefObject } from 'react';
import { useEventListener } from './useEventListener';
import useToggle from './useToggle';

type EventType = 'mousedown' | 'mouseup' | 'click' | 'touchstart' | 'touchend';

const useOutsideClick = <T extends HTMLElement = HTMLElement>(
	initialState: boolean = false,
	eventType: EventType = 'mousedown',
): [boolean, RefObject<T>] => {
	const [isOutside, toggleOutside] = useToggle(initialState);
	const ref = useRef<T>(null);

	const handleClickOutside = useCallback(
		(event: Event) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				toggleOutside(true);
			} else {
				toggleOutside(false);
			}
		},
		[toggleOutside],
	);

	useEventListener(eventType, handleClickOutside, document);

	return [isOutside, ref];
};

export default useOutsideClick;
