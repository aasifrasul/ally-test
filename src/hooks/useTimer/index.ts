import { useState, useEffect, useRef } from 'react';

interface TimeElapsed {
	seconds: number;
	milliseconds: number;
}

interface TimerControls {
	stop: () => void;
	start: () => void;
	reset: () => void;
}

export function useTimer(autoStart = false): TimeElapsed & TimerControls {
	const startTime = useRef<number | null>(null);
	const elapsedTime = useRef<number>(0);
	const animationFrameId = useRef<number | null>(null);
	const [time, setTime] = useState<TimeElapsed>({ seconds: 0, milliseconds: 0 });

	const updateTime = () => {
		if (startTime.current) {
			elapsedTime.current = Date.now() - startTime.current;
			setTime({
				seconds: Math.floor(elapsedTime.current / 1000),
				milliseconds: elapsedTime.current % 1000,
			});
			animationFrameId.current = requestAnimationFrame(updateTime);
		}
	};

	const startTimer = () => {
		if (startTime.current) {
			stopTimer();
		}

		startTime.current = Date.now() - elapsedTime.current;
		updateTime();
	};

	const stopTimer = () => {
		if (animationFrameId.current) {
			cancelAnimationFrame(animationFrameId.current);
			animationFrameId.current = null;
		}
	};

	const stop = () => stopTimer();
	const start = () => startTimer();
	const reset = () => {
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

	return { ...time, stop, start, reset };
}
