function throttle(fn, delay, options = { leading: true }) {
	let lastCall = 0;
	let timeoutId = null;
	const { leading } = options;

	function inner(...args) {
		const now = Date.now();
		const remaining = delay - (now - lastCall);
		const context = this; // Capture the context

		if (leading && !lastCall) {
			fn.apply(context, args);
			lastCall = now;
		} else if (remaining <= 0) {
			clearTimeout(timeoutId);
			timeoutId = null;
			fn.apply(context, args);
			lastCall = now;
		} else if (!timeoutId) {
			timeoutId = setTimeout(() => {
				fn.apply(context, args);
				lastCall = Date.now();
				timeoutId = null;
			}, remaining);
		}
	}

	inner.cancel = function () {
		clearTimeout(timeoutId);
		timeoutId = null;
		lastCall = 0;
	};

	return inner;
}
