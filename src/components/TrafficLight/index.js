import React from 'react';

import styles from './styles.css';

function TrafficLight(props) {
	const redRef = React.useRef(null);
	const yellowRef = React.useRef(null);
	const greenRef = React.useRef(null);
	const timeoutRef = React.useRef(null);
	const instance = React.useRef(-1);

	const durations = [
		{ ref: redRef, time: 4000 },
		{ ref: yellowRef, time: 1000 },
		{ ref: greenRef, time: 3000 },
	];

	const cleanUp = () => timeoutRef.current && clearTimeout(timeoutRef.current);
	const addClass = (elemRef, className) => elemRef.current?.classList?.add(className);
	const removeClass = (elemRef, className) => elemRef.current?.classList?.remove(className);

	const switchLights = () => {
		cleanUp();
		instance.current = ++instance.current % durations.length;
		const delay = durations[instance.current].time;
		durations.forEach((item, index) =>
			index === instance.current
				? addClass(item.ref, styles.on)
				: removeClass(item.ref, styles.on),
		);
		timeoutRef.current = setTimeout(switchLights, delay);
	};

	React.useEffect(() => {
		switchLights();
		return () => cleanUp();
	}, []);

	return (
		<div className={styles['traffic-light']}>
			<div className={styles.red} ref={redRef}></div>
			<div className={styles.yellow} ref={yellowRef}></div>
			<div className={styles.green} ref={greenRef}></div>
		</div>
	);
}

export default TrafficLight;
