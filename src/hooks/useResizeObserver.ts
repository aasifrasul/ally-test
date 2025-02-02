import { useState, useEffect } from 'react';

interface Rect {
	width: number;
	height: number;
	x: number;
	y: number;
}

const toRect = (rect: DOMRect | undefined): Rect => {
	const { width = 0, height = 0, x = 0, y = 0 } = rect || {};
	return { width, height, x, y };
};

const useResizeObserver = (ref: React.RefObject<HTMLElement>): Rect => {
	const setRectData = (): Rect => toRect(ref.current?.getBoundingClientRect());
	const [rect, setRect] = useState<Rect>(setRectData());

	useEffect(() => {
		const ro = new ResizeObserver(() => setRect(setRectData()));

		if (ref.current) {
			ro.observe(ref.current);
		}

		return () => ro.disconnect();
	}, [ref]);

	return rect;
};

export default useResizeObserver;
