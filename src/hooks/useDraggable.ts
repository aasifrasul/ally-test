import React, { useState, useRef, useCallback } from 'react';
import { useEventListener } from './';

type MoveFunction = (position: [number, number]) => void;

export const useDraggable = (onMove: MoveFunction) => {
	const ref = useRef<HTMLElement | null>(null);
	const [offset, setOffset] = useState<[number, number] | null>(null);

	const move = useCallback(
		(e: MouseEvent) => {
			if (offset) {
				onMove([e.clientX - offset[0], e.clientY - offset[1]]);
			}
		},
		[onMove, offset],
	);

	const up = useCallback(() => setOffset(null), []);

	// Only attach listeners when dragging
	useEventListener('mousemove', offset ? move : null, document);
	useEventListener('mouseup', offset ? up : null, document);

	const onMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault(); // Prevent text selection
		const rect = ref.current?.getBoundingClientRect();
		if (rect) {
			setOffset([e.clientX - rect.left, e.clientY - rect.top]);
		}
	}, []);

	return [ref, onMouseDown] as const;
};
