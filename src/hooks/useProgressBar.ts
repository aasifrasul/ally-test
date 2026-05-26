import { useEffect, useRef, useState } from 'react';

export function useProgressBar(active: boolean) {
	const [progress, setProgress] = useState(0);
	const rafRef = useRef<number>(0);

	useEffect(() => {
		if (!active) {
			setProgress(0);
			return;
		}

		let value = 0;

		const animate = () => {
			value += (100 - value) * 0.05; // easing
			setProgress(value);

			if (value < 95) {
				rafRef.current = requestAnimationFrame(animate);
			}
		};

		rafRef.current = requestAnimationFrame(animate);

		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [active]);

	return progress;
}
