function mySetInterval(callback, interval, ...args) {
	let timerId;
	const params = args.slice();

	function inner() {
		if (timerId === null) return;

		try {
			callback(...params);
		} catch (err) {
			throw err;
		}

		timerId = setTimeout(inner, interval);
	}

	inner();

	const cancel = () => {
		if (timerId) {
			clearTimeout(timerId);
			timerId = null;
		}
	};

	return cancel;
}
