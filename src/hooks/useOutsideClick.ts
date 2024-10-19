import { useCallback, useRef, useState, RefObject, useEffect } from 'react';
import { useEventListener } from './useEventListener';
import useToggle from './useToggle';

type EventType = 'mousedown' | 'mouseup' | 'click' | 'touchstart' | 'touchend';

const useOutsideClick = <T extends HTMLElement = HTMLElement>(
	initialState: boolean = false,
	eventType: EventType = 'mousedown',
): [boolean, RefObject<T>] => {
	const [state, toggle] = useToggle(initialState);
	const ref = useRef<T>(null);

	const handleClickOutside = useCallback((event: Event) => {
		const currentValue: boolean =
			ref.current && !ref.current.contains(event.target as Node) ? true : false;
		toggle(currentValue);
	}, []);

	useEventListener(eventType, handleClickOutside, document);
	/*
	useEffect(() => {
		document.addEventListener(eventType, handleClickOutside);

		return () => {
			document.removeEventListener(eventType, handleClickOutside);
		};
	}, [eventType, handleClickOutside]);
	*/

	return [state, ref];
};

export default useOutsideClick;
