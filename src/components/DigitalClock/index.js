import React from 'react';

import css from './styles.css';

const styles = css?.locals;

const DigitalClock = (props) => {
	const [timeString, setTimeString] = React.useState('');
	const timerRef = React.useRef(null);

	const clearTimer = () => timerRef.current && clearTimeout(timerRef.current);

	const updateTime = (k) => (k < 10 ? '0' + k : k);

	function getCurrentTime(format) {
		const date = new Date();
		let hour = updateTime(date.getHours());
		const minute = updateTime(date.getMinutes());
		const second = updateTime(date.getSeconds());
		clearTimer();

		if (format === '12-hour') {
			const meridiem = hour >= 12 ? 'PM' : 'AM';
			hour = hour == 0 ? 12 : hour > 12 ? hour - 12 : hour;
		}

		let timeText = hour + ' : ' + minute + ' : ' + second;
		if (format === '12-hour') {
			timeText += ' ' + meridiem;
		}
		setTimeString(() => timeText);
		timerRef.current = setTimeout(getCurrentTime, 1000);
	}

	React.useEffect(() => {
		getCurrentTime();
		return () => clearTimer();
	}, []);

	return <div className={styles.clock}>{timeString}</div>;
};

export default DigitalClock;
