import { useState, useEffect, useRef } from 'react';

interface TimeElapsed {
	seconds: number;
	milliseconds: number;
}

interface TimerControls {
	handleStop: () => void;
	handleResume: () => void;
	handleReset: () => void;
}

export function useTimer(autoStart = true): TimeElapsed & TimerControls {
	const startTime = useRef<number | null>(null);
	const elapsedTime = useRef<number>(0);
	const animationFrameId = useRef<number | null>(null);
	const [time, setTime] = useState<TimeElapsed>({ seconds: 0, milliseconds: 0 });

	const updateTime = () => {
		if (startTime.current !== null) {
			const now = Date.now();
			elapsedTime.current = now - startTime.current;
			setTime({
				seconds: Math.floor(elapsedTime.current / 1000),
				milliseconds: elapsedTime.current % 1000,
			});
			animationFrameId.current = requestAnimationFrame(updateTime);
		}
	};

	const startTimer = () => {
		if (startTime.current === null) {
			startTime.current = Date.now() - elapsedTime.current;
			updateTime();
		}
	};

	const stopTimer = () => {
		if (animationFrameId.current !== null) {
			cancelAnimationFrame(animationFrameId.current);
			animationFrameId.current = null;
		}
	};

	const handleStop = () => stopTimer();
	const handleResume = () => startTimer();
	const handleReset = () => {
		stopTimer();
		startTime.current = null;
		elapsedTime.current = 0;
		setTime({ seconds: 0, milliseconds: 0 });
	};

	useEffect(() => {
		if (autoStart) {
			startTimer();
		}
		return stopTimer;
	}, []);

	return { ...time, handleStop, handleResume, handleReset };
}
