import { useEffect, useState } from 'react';

export function useLoadingDelay(loading: boolean, delay = 150, minDuration = 400) {
	const [visible, setVisible] = useState(false);
	const [startTime, setStartTime] = useState<number | null>(null);

	useEffect(() => {
		let delayTimer: NodeJS.Timeout;
		let hideTimer: NodeJS.Timeout;

		if (loading) {
			delayTimer = setTimeout(() => {
				setStartTime(Date.now());
				setVisible(true);
			}, delay);
		} else {
			if (startTime) {
				const elapsed = Date.now() - startTime;
				const remaining = Math.max(minDuration - elapsed, 0);

				hideTimer = setTimeout(() => {
					setVisible(false);
					setStartTime(null);
				}, remaining);
			} else {
				setVisible(false);
			}
		}

		return () => {
			clearTimeout(delayTimer);
			clearTimeout(hideTimer);
		};
	}, [loading]);

	return visible;
}
