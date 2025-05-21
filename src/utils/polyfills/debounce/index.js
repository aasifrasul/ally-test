function debounce(fn, delay, options = { leading: false, trailing: true }) {
	let timeoutId, lastArgs, lastThis;

	function core() {
		fn.apply(lastThis, lastArgs);
		lastThis = lastArgs = null;
	}

	function later() {
		inner.cancel();
		if (options.trailing) {
			core();
		}
	};

	function inner(...args) {
		lastThis = this;
		lastArgs = args;

		if (options.leading && !timeoutId) {
			core();
		}
		
		inner.cancel();
		timeoutId = setTimeout(later, delay);

	}

	inner.flush = function () {
		inner.cancel();
		core();
	};

	inner.cancel = function () {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = null;
	};

	return inner;
}
