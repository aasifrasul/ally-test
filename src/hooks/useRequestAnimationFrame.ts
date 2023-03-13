import { useEffect, useRef } from 'react';

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
	const savedCallback = useRef(callback);
	const savedDuration = useRef(duration);
	const shouldResetStartTime = useRef(false);
	const startTime = useRef(0);
	const rAFRef = useRef(0);

	useEffect(() => {
		if (duration <= 0) {
			return;
		}

		// Remember the latest callback, and duration if it changes
		savedCallback.current = callback;
		savedDuration.current = duration;

		shouldResetStartTime.current = true;

		// setup the requestAnimationFrame
		function tick(time: number) {
			if (!startTime.current || shouldResetStartTime.current) {
				startTime.current = time;
			}
			shouldResetStartTime.current = false;

			const runtime = time - startTime.current;
			const relativeProgress = runtime / savedDuration.current;
			const isLastFrame = runtime >= savedDuration.current;

			if (!isLastFrame) {
				rAFRef.current = requestAnimationFrame(tick);
			}

			savedCallback.current(relativeProgress, isLastFrame);
		}

		if (rAFRef.current) {
			cancelAnimationFrame(rAFRef.current);
		}
		rAFRef.current = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(rAFRef.current);
	}, [callback]);
}

export default useRequestAnimationFrame;
