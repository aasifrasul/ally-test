const throttleFunction = function throttle(func, delay) {
	let timerId;
	const wrapper = function (...args) {
		if (!timerId) {
			func.apply(null, ...args);
			timerId = setTimeout(() => {
				clearTimeout(timerId);
				timerId = false;
			}, limit);
		}
	};
	wrapper.cancel = () => clearTimeout(timerId);
	return wrapper;
};

const debounceFunction = function (func, delay) {
	let timerId;
	const wrapper = function wrapper(...args) {
		// Cancels the setTimeout method execution
		clearTimeout(timerId);

		// Executes the func after delay time.
		timerId = setTimeout(func, delay, ...args);
	};
	wrapper.cancel = () => clearTimeout(timerId);
	return wrapper;
};

const debounce = function debounce(func, delay) {
	let timerId;
	const wrapper = function wrapper(...args) {
		timerId && clearTimeout(timerId);
		timerId = setTimeout(() => {
			func.apply(func, args);
			clearTimeout(timerId);
			timerId = null;
		}, delay);
	};
	wrapper.cancel = () => clearTimeout(timerId);
	return wrapper;
};

const throttle = function throttle(func, delay) {
	let timerId;
	let lastRan;
	const wrapper = function wrapper(...args) {
		if (lastRan) {
			timerId && clearTimeout(timerId);
			timerId = setTimeout(
				() => {
					if (Date.now() - lastRan >= delay) {
						func.apply(null, ...args);
						lastRan = Date.now();
						clearTimeout(timerId);
					}
				},
				delay - (Date.now() - lastRan),
			);
		} else {
			func.apply(null, args);
			lastRan = Date.now();
		}
	};
	wrapper.cancel = () => clearTimeout(timerId);
	return wrapper;
};

export { debounce, throttle };
