function debounce(fn, delay, options = { leading: false, trailing: true }) {
	let timeoutId, result, lastArgs, lastThis;

	function core() {
		result = fn.apply(lastThis, lastArgs);
		lastThis = lastArgs = null;
		return result;
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
