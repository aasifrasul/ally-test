export function dbounce<T extends unknown[]>(
	fn: (...args: T) => void,
	delay: number,
): ((...args: T) => void) & { cancel: () => void } {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const debounced = function (this: unknown, ...args: T) {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			fn.apply(this, args);
			timeoutId = null;
		}, delay);
	} as ((...args: T) => void) & { cancel: () => void };

	debounced.cancel = function () {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	return debounced;
}
