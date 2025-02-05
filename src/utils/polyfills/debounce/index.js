function debounce(fn, delay) {
	const context = this;
	let timeoutId;

	function inner(...params) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			inner(...params);
			fn.apply(context, params);
		}, delay);
	}

	inner.cancel = function () {
		clearTimeout(timeoutId);
		timeoutId = null;
	};

	return inner;
}

const debouncedLog = debounce(console.log, 1000);
debouncedLog('hi', 'There');
