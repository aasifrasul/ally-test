import { useState, useRef, RefObject, useCallback } from 'react';
import { useEventListener } from './useEventListener';

interface UseHoverOptions {
	enterDelay?: number;
	leaveDelay?: number;
}

export function useHover<T extends HTMLElement = HTMLElement>({
	enterDelay = 0,
	leaveDelay = 0,
}: UseHoverOptions = {}): [RefObject<HTMLDivElement>, boolean] {
	const [isHovered, setIsHovered] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const handleMouseEnter = useCallback(() => {
		const timer = setTimeout(() => setIsHovered(true), enterDelay);
		return () => clearTimeout(timer);
	}, [enterDelay]);

	const handleMouseLeave = useCallback(() => {
		const timer = setTimeout(() => setIsHovered(false), leaveDelay);
		return () => clearTimeout(timer);
	}, [leaveDelay]);

	useEventListener('mouseenter', handleMouseEnter, ref.current);
	useEventListener('mouseleave', handleMouseLeave, ref.current);

	return [ref, isHovered];
}
