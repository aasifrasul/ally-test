export function throttle(func, delay) {
	let timerId;

	function throttled(...args) {
		if (timerId) return;

		func.apply(this, args);

		timerId = setTimeout(() => {
			timerId = null;
		}, delay);
	}

	throttled.cancel = () => {
		if (timerId) {
			clearTimeout(timerId);
			timerId = null;
		}
	};

	return throttled;
}

export function debounce(func, delay) {
	let timerId;

	function debounced(...args) {
		debounced.cancel();

		timerId = setTimeout(() => {
			func.apply(this, args);
			timerId = null;
		}, delay);
	}

	debounced.cancel = () => {
		if (timerId) {
			clearTimeout(timerId);
			timerId = null;
		}
	};

	return debounced;
}
