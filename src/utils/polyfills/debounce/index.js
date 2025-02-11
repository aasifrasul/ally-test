function debounce(fn, delay) {
	let timeoutId = null;

	function debounced(...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fn.apply(this, args);
			timeoutId = null;
		}, delay);
	}

	debounced.cancel = function () {
		clearTimeout(timeoutId);
		timeoutId = null;
	};

	return debounced;
}
