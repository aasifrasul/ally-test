import { useEffect, useState } from 'react';
import { useGlobalLoading } from '../../../hooks/useGlobalLoading';
import { useProgressBar } from '../../../hooks/useProgressBar';

const SHOW_DELAY = 150;
const MIN_VISIBLE = 400;

export function GlobalLoader() {
	const pending = useGlobalLoading();
	const [visible, setVisible] = useState(false);
	const progress = useProgressBar(visible);

	useEffect(() => {
		let delayTimer: NodeJS.Timeout;
		let hideTimer: NodeJS.Timeout;

		if (pending > 0) {
			delayTimer = setTimeout(() => {
				setVisible(true);
			}, SHOW_DELAY);
		} else {
			hideTimer = setTimeout(() => {
				setVisible(false);
			}, MIN_VISIBLE);
		}

		return () => {
			clearTimeout(delayTimer);
			clearTimeout(hideTimer);
		};
	}, [pending]);

	if (!visible) return null;

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				height: '3px',
				width: `${progress}%`,
				background: 'linear-gradient(90deg,#4facfe,#00f2fe)',
				transition: 'width 0.2s ease',
				zIndex: 9999,
			}}
		/>
	);
}
