import { useState, useRef, RefObject, useCallback, useEffect } from 'react';
import { useEventListener } from './';

interface UseHoverOptions {
	enterDelay?: number;
	leaveDelay?: number;
}

interface UseHoverReturn<T extends HTMLElement = HTMLElement> {
	hoverRef: RefObject<T | null>;
	isHovered: boolean;
}

export function useHover<T extends HTMLElement = HTMLElement>({
	enterDelay = 0,
	leaveDelay = 0,
}: UseHoverOptions = {}): UseHoverReturn<T> {
	const [isHovered, setIsHovered] = useState(false);
	const hoverRef = useRef<T>(null);
	const enterTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
	const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	const handleMouseEnter = useCallback(() => {
		// Clear any pending leave timeout
		if (leaveTimeoutRef.current) {
			clearTimeout(leaveTimeoutRef.current);
		}

		enterTimeoutRef.current = setTimeout(() => {
			setIsHovered(true);
		}, enterDelay);
	}, [enterDelay]);

	const handleMouseLeave = useCallback(() => {
		// Clear any pending enter timeout
		if (enterTimeoutRef.current) {
			clearTimeout(enterTimeoutRef.current);
		}

		leaveTimeoutRef.current = setTimeout(() => {
			setIsHovered(false);
		}, leaveDelay);
	}, [leaveDelay]);

	useEventListener('mouseenter', handleMouseEnter, hoverRef.current);
	useEventListener('mouseleave', handleMouseLeave, hoverRef.current);

	useEffect(() => {
		const element = hoverRef.current;
		if (!element) return;

		return () => {
			// Clean up any pending timeouts
			if (enterTimeoutRef.current) {
				clearTimeout(enterTimeoutRef.current);
			}
			if (leaveTimeoutRef.current) {
				clearTimeout(leaveTimeoutRef.current);
			}
		};
	}, [handleMouseEnter, handleMouseLeave]);

	return { hoverRef, isHovered };
}
