import { useRef, useCallback } from 'react';

type DebounceFunction<A extends any[]> = (...args: A) => void;

export const useDebouncedCallback = <A extends any[]>(
	callback: (...args: A) => void,
	delay: number,
): DebounceFunction<A> => {
	const callbackRef = useRef<DebounceFunction<A>>();
	callbackRef.current = callback;

	return useCallback(
		(...args: A) => {
			const currentTimeout: NodeJS.Timer = setTimeout(() => {
				callbackRef.current?.(...args);
			}, delay);

			return () => clearTimeout(currentTimeout as unknown as number);
		},
		[delay],
	);
};

/*

export const useDebouncedCallback = <A extends any[]>(
	callback: (...args: A) => void,
	delay: number
): DebounceFunction<A> => {
	const callbackRef = useRef(callback);
	callbackRef.current = callback; // Keep the ref updated

	const debouncedCallback = useCallback(
		debounce((...args: A) => callbackRef.current(...args), delay),
		[delay] //  Crucially, add 'delay' to the dependency array
	);

	// Cleanup timeout on unmount or delay change
	useEffect(() => {
		return () => {
			debouncedCallback.cancel(); // Assuming your debounce function has a cancel method
		};
	}, [debouncedCallback]); // Add debouncedCallback to the dependency array

	return debouncedCallback;
};

// Example usage:
function MyComponent() {
	const [count, setCount] = React.useState(0);

	const handleClick = () => {
		setCount((c) => c + 1);
		console.log(count);
	};

	const debouncedClick = useDebouncedCallback(handleClick, 500);

	return <button onClick={debouncedClick}>Click me</button>;
}

*/
