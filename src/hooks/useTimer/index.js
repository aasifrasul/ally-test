import React, { useState, useEffect, useRef } from 'react';

function useTimer(timePeriod = 1000) {
	const timeElapsed = useRef({});
	const intervalID = useRef(0);
	const [timer, setTimer] = useState(timePeriod < 1000 ? 0 : 1);
	const [toggle, setToggle] = useState(true);

	const stopTimer = () => {
		if (intervalID.current) {
			clearInterval(intervalID.current);
			intervalID.current = 0;
		}
	};

	useEffect(() => {
		stopTimer();
		intervalID.current = setInterval(() => setTimer(timer + 1), timePeriod);
		const totalTime = timePeriod * timer;
		timeElapsed.current = {
			seconds: Math.floor(totalTime / 1000),
			fraction: totalTime % 1000,
		};
		return stopTimer;
	}, [timer, toggle]);

	const handleStop = () => stopTimer();
	const handleResume = () => setToggle((data) => !data);
	const handleReset = () => setTimer(() => (timeElapsed.current = 0));

	return { ...timeElapsed.current, handleStop, handleResume, handleReset };
}

export default useTimer;
