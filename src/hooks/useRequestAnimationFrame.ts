import { useEffect, useRef } from 'react';
import { useCallbackRef } from './';

/**
 * A duration based hook for requestAnimationFrame.
 * Registers callback until the duration is complete.
 * Provides the relative progress and a flag for last frame in the callback.
 * @param callback : Specifies the callback that will be invoked when a frame is rendered
 * @param duration : Specifies the time, in seconds, for listening to the animation frames
 */
function useRequestAnimationFrame(
	callback: (relativeProgress: number, isLastFrame: boolean) => void,
	duration: number,
) {
	const callbackRef = useCallbackRef(callback);
	const durationRef = useRef(duration);
	const resetStartTimeRef = useRef(false);
	const timeRef = useRef(0);
	const rAFRef = useRef(0);

	useEffect(() => {
		if (duration <= 0) {
			return;
		}

		durationRef.current = duration;
		resetStartTimeRef.current = true;

		// setup the requestAnimationFrame
		function tick(time: number) {
			if (!timeRef.current || resetStartTimeRef.current) {
				timeRef.current = time;
			}
			resetStartTimeRef.current = false;

			const runtime = time - timeRef.current;
			const relativeProgress = runtime / durationRef.current;
			const isLastFrame = runtime >= durationRef.current;

			if (!isLastFrame) {
				rAFRef.current = requestAnimationFrame(tick);
			}

			callbackRef.current(relativeProgress, isLastFrame);
		}

		if (rAFRef.current) {
			cancelAnimationFrame(rAFRef.current);
		}
		rAFRef.current = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(rAFRef.current);
	}, [callback, duration]);
}

export default useRequestAnimationFrame;
