export function setInterval(callback, interval, ...params) {
	if (typeof callback !== 'function') {
		throw new TypeError('Callback must be a function');
	}

	if (typeof interval !== 'number' || interval < 0) {
		throw new TypeError('Interval must be a positive number');
	}

	let timeoutId;
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
			timeoutId = null;
			isRunning = false;
			isPaused = false;
			interval = null;
			callback = null;
			pause = null;
			resume = null;
			params = null;
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
