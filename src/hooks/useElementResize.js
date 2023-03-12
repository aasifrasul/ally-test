import React, { useRef, useEffect } from 'react';

const useElementResize = (ref) => {
	const [rect, setRect] = useState({});

	useEffect(
		() => {
			const ro = new ResizeObserver((entries, observer) => {
				for (const entry of entries) {
					if (entry.target === ref.current) {
						// update state if this is our DOM Node
						// (we may support multiple refs)
						setRect(entry.contentRect);
					}
				}
			});
			// observe the passed in ref
			ro.observe(ref.current);
			return () => ro.disconnect();
		},
		[ref], // only update on ref change
	);

	return rect;
};
