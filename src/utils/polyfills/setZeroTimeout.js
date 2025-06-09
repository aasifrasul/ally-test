// Enhanced setZeroTimeout that accepts parameters
// Only add setZeroTimeout to the window object, and hide everything
// else in a closure.
(function () {
	const timeouts = [];
	const messageName = 'zero-timeout-message';

	// Like setTimeout, but with zero delay and support for parameters
	function setZeroTimeout(fn, ...args) {
		if (typeof fn !== 'function') {
			throw new Error('Please pass a valid function');
		}

		// Store both the function and its arguments
		timeouts.push(() => fn(...args));
		window.postMessage(messageName, '*');
	}

	function handleMessage(event) {
		if (event.source == window && event.data == messageName) {
			event.stopPropagation();
			if (timeouts.length > 0) {
				const fn = timeouts.shift();
				fn();
			}
		}
	}

	window.addEventListener('message', handleMessage, true);

	// Add the one thing we want added to the window object.
	window.setZeroTimeout = setZeroTimeout;
})();

// Usage examples:
// setZeroTimeout(() => console.log('No parameters'));
// setZeroTimeout((name, age) => console.log(`Hello ${name}, age ${age}`), 'John', 25);
// setZeroTimeout(console.log, 'This works too!');

// Alternative implementation that mimics setTimeout's signature more closely:
(function () {
	const timeouts = [];
	const messageName = 'zero-timeout-message-v2';

	function setZeroTimeoutV2(fn, delay = 0, ...args) {
		// Note: delay parameter is ignored (always 0), but kept for setTimeout compatibility
		if (typeof fn !== 'function') {
			throw new Error('Please pass a valid function');
		}

		timeouts.push(() => fn(...args));
		window.postMessage(messageName, '*');
	}

	function handleMessage(event) {
		if (event.source == window && event.data == messageName) {
			event.stopPropagation();
			if (timeouts.length > 0) {
				const fn = timeouts.shift();
				fn();
			}
		}
	}

	window.addEventListener('message', handleMessage, true);

	// Alternative version with setTimeout-like signature
	window.setZeroTimeoutV2 = setZeroTimeoutV2;
})();
