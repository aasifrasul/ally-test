function throttle(fn, delay) {
	let lastCall = 0;
	let timeoutId = null;

	function inner(...args) {
		const now = Date.now();

		// If enough time has passed, execute immediately
		if (now - lastCall >= delay) {
			inner.cancel();
			fn.apply(this, args);
			lastCall = now;
		}
		// If within delay period and no timeout set, schedule next execution
		else if (!timeoutId) {
			timeoutId = setTimeout(
				() => {
					fn.apply(this, args);
					lastCall = Date.now();
					timeoutId = null;
				},
				delay - (now - lastCall),
			);
		}
	}

	inner.cancel = function () {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	return inner;
}
