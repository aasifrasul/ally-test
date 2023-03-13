import React, { useState, useEffect, useRef } from 'react';

function stopwatch(props) {
	const seconds = useRef(0);
	const intervalID = useRef(0);
	const [timer, setTimer] = useState(0);
	const [toggle, setToggle] = useState(true);

	const stopTimer = () => clearInterval(intervalID.current);

	useEffect(() => {
		intervalID.current = setInterval(
			() =>
				setTimer((timerCount) => {
					if (timerCount === 9) {
						timerCount = 0;
						seconds.current++;
					}
					return timerCount + 1;
				}),
			100,
		);
		return stopTimer;
	}, [toggle]);
	const handleStop = () => (e) => stopTimer();
	const handleStart = () => (e) => setToggle(!toggle);
	const handleReset = () => (e) => setTimer(() => (seconds.current = 0));
	return (
		<div>
			{seconds.current} {timer}
			<button onClick={handleStop()}>Stop</button>
			<button onClick={handleStart()}>Start</button>
			<button onClick={handleReset()}>Reset</button>
		</div>
	);
}

export default stopwatch;
