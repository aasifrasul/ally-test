const throttleFunction = function throttle(func, delay) {
	let timerId = false;
	const wrapper = function (...args) {
		if (!timerId) {
			func.apply(null, ...args);
			timerId = setTimeout(() => {
				clearTimeout(timerId);
				timerId = false;
			}, delay);
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
			func.apply(this, args);
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
						func.apply(this, ...args);
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
/*
const throttle = (func, ms) => {
	let isThrottled = false,
		savedArgs,
		savedThis;

	function wrapper() {
		if (isThrottled) {
			// (2)
			savedArgs = arguments;
			savedThis = this;
			return;
		}
		isThrottled = true;

		func.apply(this, arguments); // (1)

		setTimeout(function () {
			isThrottled = false; // (3)
			if (savedArgs) {
				wrapper.apply(savedThis, savedArgs);
				savedArgs = savedThis = null;
			}
		}, ms);
	}

	return wrapper;
};
*/
export { debounce, throttle };
