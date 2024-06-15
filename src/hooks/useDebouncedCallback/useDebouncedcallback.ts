import { useEffect, useRef } from 'react';

export function useDebouncedCallback<A extends any[]>(
	callback: (...args: A) => void,
	wait: number,
) {
	// track args & timeout handle between calls
	const argsRef = useRef<A>();
	const timeout = useRef<ReturnType<typeof setTimeout>>();

	const cleanup = () => timeout.current && clearTimeout(timeout.current);

	// make sure our timeout gets cleared if
	// our consuming component gets unmounted
	useEffect(() => cleanup, []);

	return function debouncedCallback(...args: A) {
		// capture latest args
		argsRef.current = args;

		// clear debounce timer
		cleanup();

		// start waiting again
		timeout.current = setTimeout(
			() => argsRef.current && callback(...argsRef.current),
			wait,
		);
	};
}

/**
 * 
 * Implementation
 * 
 * const handleClick = useDebouncedCallback(() => {
  onClick();
  console.log(count);
}, 500);

*/
