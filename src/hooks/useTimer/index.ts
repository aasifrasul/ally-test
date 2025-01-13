import { useState, useEffect, useRef } from 'react';

interface TimeElapsed {
	seconds: number;
	fraction: number;
}

interface TimerControls {
	handleStop: () => void;
	handleResume: () => void;
	handleReset: () => void;
}

function useTimer(timePeriod: number = 1000): TimeElapsed & TimerControls {
	const timeElapsed = useRef<TimeElapsed>({ seconds: 0, fraction: 0 });
	const intervalID = useRef<number | null>(null);
	const [timer, setTimer] = useState<number>(timePeriod < 1000 ? 0 : 1);

	const stopTimer = () => {
		if (intervalID.current !== null) {
			clearInterval(intervalID.current);
			intervalID.current = null;
		}
	};

	useEffect(() => {
		stopTimer();
		intervalID.current = window.setInterval(
			() => setTimer((prevTimer) => prevTimer + 1),
			timePeriod,
		);
		const totalTime = timePeriod * timer;
		timeElapsed.current = {
			seconds: Math.floor(totalTime / 1000),
			fraction: totalTime % 1000,
		};
		return stopTimer;
	}, [timer, timePeriod]);

	const handleStop = () => stopTimer();
	const handleResume = () => setTimer((prevTimer) => prevTimer + 1);
	const handleReset = () =>
		setTimer(() => {
			timeElapsed.current = { seconds: 0, fraction: 0 };
			return timePeriod < 1000 ? 0 : 1;
		});

	return { ...timeElapsed.current, handleStop, handleResume, handleReset };
}

export default useTimer;
