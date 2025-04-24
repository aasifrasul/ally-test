function debounce(fn, delay, options = { leading: false, trailing: true }) {
	let timeoutId, lastArgs, lastThis;

	function core() {
		fn.apply(lastThis, lastArgs);
		lastThis = lastArgs = null;
	}

	function inner(...args) {
		lastThis = this;
		lastArgs = args;
		const callNow = options.leading && !timeoutId;

		const later = () => {
			inner.cancel();
			if (options.trailing) {
				core();
			}
		};

		inner.cancel();
		timeoutId = setTimeout(later, delay);

		if (callNow) {
			core();
		}
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
