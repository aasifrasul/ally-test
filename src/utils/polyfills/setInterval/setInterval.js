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

	function scheduleTimeout() {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(internal, interval);
	}

	function internal() {
		if (!isRunning) return;

		scheduleTimeout();
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
		scheduleTimeout();
	}

	isRunning = true;
	scheduleTimeout();
	return { stop, pause, resume };
}
