import { useState, useRef, RefObject, useCallback } from 'react';
import { useEventListener } from './EventListeners/useEventListener';

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

	const handleMouseEnter = useCallback(() => {
		const timer = setTimeout(() => setIsHovered(true), enterDelay);
		return () => clearTimeout(timer);
	}, [enterDelay]);

	const handleMouseLeave = useCallback(() => {
		const timer = setTimeout(() => setIsHovered(false), leaveDelay);
		return () => clearTimeout(timer);
	}, [leaveDelay]);

	useEventListener('mouseover', handleMouseEnter, hoverRef.current);
	useEventListener('mouseout', handleMouseLeave, hoverRef.current);

	return { hoverRef, isHovered };
}
