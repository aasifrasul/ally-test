export function setInterval(
	callback: (...args: any[]) => void,
	interval: number,
	...params: any[]
): {
	stop: () => void;
	pause: () => void;
	resume: () => void;
} {
	if (typeof callback !== 'function') {
		throw new TypeError('Callback must be a function');
	}

	if (typeof interval !== 'number' || interval < 0) {
		throw new TypeError('Interval must be a positive number');
	}

	let timeoutId: NodeJS.Timeout | undefined;
	let isRunning = false;
	let isPaused = false;

	function internal() {
		if (!isRunning) return;

		timeoutId = setTimeout(internal, interval);
		try {
			callback(...params);
		} catch (error) {
			stop();
			throw error; // Re-throw to maintain error visibility
		}
	}

	function stop() {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
			isRunning = false;
			isPaused = false;
		}
	}

	function pause() {
		if (!isRunning || isPaused) return;
		clearTimeout(timeoutId);
		isPaused = true;
	}

	function resume() {
		if (!isPaused || !isRunning) return;
		isPaused = false;
		timeoutId = setTimeout(internal, interval);
	}

	isRunning = true;
	timeoutId = setTimeout(internal, interval);
	return { stop, pause, resume };
}
