import { useEffect, useState, RefObject } from 'react';

export const useElementResize = (ref: RefObject<HTMLElement>) => {
	const [rect, setRect] = useState<DOMRectReadOnly>(new DOMRectReadOnly(0, 0, 0, 0));

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === element) {
					setRect(entry.contentRect);
				}
			}
		});

		ro.observe(element);
		return () => ro.disconnect();
	}, [ref]);

	return rect;
};
/*
Usage
function MyComponent() {
  const ref = useRef(null);
  const rect = useElementResize(ref);

  return (
    <div ref={ref}>
      Width: {rect.width}px, Height: {rect.height}px
    </div>
  );
}
*/
