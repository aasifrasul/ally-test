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

	let timeoutId: NodeJS.Timeout | null;
	let state: 'running' | 'paused' | 'stopped' = 'running';

	function internal() {
		if (state !== 'running') return;

		try {
			callback(...params);
		} catch (error) {
			stop();
			throw error;
		}

		timeoutId = setTimeout(internal, interval);
	}

	function stop() {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		state = 'stopped';
	}

	function pause() {
		if (state !== 'running') return;
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		state = 'paused';
	}

	function resume() {
		if (state !== 'paused') return;
		state = 'running';
		timeoutId = setTimeout(internal, interval);
	}

	timeoutId = setTimeout(internal, interval);
	return { stop, pause, resume };
}
