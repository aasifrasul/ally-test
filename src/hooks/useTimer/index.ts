import { useState, useEffect, useRef, useCallback } from 'react';

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

	const updateTime = useCallback(() => {
		if (startTime.current) {
			elapsedTime.current = Date.now() - startTime.current;
			setTime({
				seconds: Math.floor(elapsedTime.current / 1000),
				milliseconds: elapsedTime.current % 1000,
			});
			animationFrameId.current = requestAnimationFrame(updateTime);
		}
	}, []);

	const stop = useCallback(() => {
		if (animationFrameId.current) {
			cancelAnimationFrame(animationFrameId.current);
			animationFrameId.current = null;
		}
	}, []);

	const start = useCallback(() => {
		if (startTime.current) {
			stop();
		}

		startTime.current = Date.now() - elapsedTime.current;
		updateTime();
	}, [stop, updateTime]);

	const reset = useCallback(() => {
		stop();
		startTime.current = null;
		elapsedTime.current = 0;
		setTime({ seconds: 0, milliseconds: 0 });
	}, [stop]);

	useEffect(() => {
		if (autoStart) {
			start();
		}
		return stop;
	}, [autoStart, start, stop]);

	return { ...time, stop, start, reset };
}
