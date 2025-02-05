function throttle(fn, delay) {
	const context = this;
	let timeoutId;

	function inner(...params) {
		if (timeoutId) {
			return;
		}

		timeoutId = setTimeout(() => {
			fn.apply(context, params);
			inner.cancel();
			inner(...params);
		}, delay);
	}

	inner.cancel = function () {
		clearTimeout(timeoutId);
		timeoutId = null;
	};

	return inner;
}

const throttledLog = throttle(console.log, 5000);
throttledLog('Hi', 'There');
