// components/TrafficLight/index.jsx
import React, { useRef, useEffect } from 'react';
import * as styles from './styles.module.css';

function TrafficLight() {
	const redRef = useRef<HTMLDivElement>(null);
	const yellowRef = useRef<HTMLDivElement>(null);
	const greenRef = useRef<HTMLDivElement>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const instance = useRef(-1);

	const durations = [
		{ ref: redRef, time: 4000 },
		{ ref: yellowRef, time: 1000 },
		{ ref: greenRef, time: 3000 },
	];

	const cleanUp = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
	};

	const addClass = (elemRef: React.RefObject<HTMLDivElement | null>, className: string) => {
		elemRef.current?.classList?.add(className);
	};

	const removeClass = (
		elemRef: React.RefObject<HTMLDivElement | null>,
		className: string,
	) => {
		elemRef.current?.classList?.remove(className);
	};

	const switchLights = () => {
		cleanUp();
		instance.current = (instance.current + 1) % durations.length;
		const delay = durations[instance.current].time;

		durations.forEach((item, index) => {
			if (index === instance.current) {
				addClass(item.ref, styles.on);
			} else {
				removeClass(item.ref, styles.on);
			}
		});

		timeoutRef.current = setTimeout(switchLights, delay);
	};

	useEffect(() => {
		switchLights();
		return cleanUp;
	}, []);

	return (
		<div className={styles.trafficLight}>
			<div className={styles.red} ref={redRef} />
			<div className={styles.yellow} ref={yellowRef} />
			<div className={styles.green} ref={greenRef} />
		</div>
	);
}

export default TrafficLight;
