import React from 'react';

import * as styles from './styles.module.css';

const DigitalClock = () => {
	const [timeString, setTimeString] = React.useState('');
	const timerRef = React.useRef<NodeJS.Timeout | null>(null);

	const clearTimer = () => timerRef.current && clearTimeout(timerRef.current);

	const updateTime = (k: number) => (k < 10 ? '0' + k : k);

	function getCurrentTime(format: '12-hour' | '24-hour') {
		const date = new Date();
		let hour = updateTime(date.getHours());
		const minute = updateTime(date.getMinutes());
		const second = updateTime(date.getSeconds());
		const hourNumber = Number(hour);
		const meridiem = hourNumber >= 12 ? 'PM' : 'AM';
		clearTimer();

		if (format === '12-hour') {
			hour = hourNumber === 0 ? 12 : hourNumber > 12 ? hourNumber - 12 : hourNumber;
		}

		let timeText = hour + ' : ' + minute + ' : ' + second;
		if (format === '12-hour') {
			timeText += ' ' + meridiem;
		}

		setTimeString(() => timeText);

		// Schedule the next update
		timerRef.current = setTimeout(
			() => getCurrentTime(format),
			1000,
		) as unknown as NodeJS.Timeout;
	}

	React.useEffect(() => {
		getCurrentTime('24-hour');
		return () => {
			clearTimer();
		};
	}, []);

	return <div className={styles.clock}>{timeString}</div>;
};

export default DigitalClock;
