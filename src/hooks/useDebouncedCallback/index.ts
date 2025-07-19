import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<A extends any[]>(
	callback: (...args: A) => void,
	wait: number,
) {
	const callbackRef = useRef(callback);
	const argsRef = useRef<A>(null);
	const timeout = useRef<NodeJS.Timeout>(undefined);

	// Keep callback ref updated
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// Cleanup on unmount
	useEffect(() => {
		return cancel;
	}, []);

	const cancel = useCallback(() => {
		if (timeout.current) {
			clearTimeout(timeout.current);
			timeout.current = undefined;
		}
	}, []);

	const debouncedCallback = useCallback(
		(...args: A) => {
			argsRef.current = args;
			cancel();
			timeout.current = setTimeout(() => {
				callbackRef.current(...argsRef.current!);
			}, wait);
		},
		[wait, cancel],
	);

	return { debouncedCallback, cancel };
}

/*
// Usage Example:
function MyComponent() {
	const [value, setValue] = useState('');

	const { debouncedCallback: handleChange } = useDebouncedCallback((newValue: string) => {
		// This will only run after 500ms of no changes
		console.log('Debounced value:', newValue);
		makeAPICall(newValue);
	}, 500);

	return (
		<input
			value={value}
			onChange={(e) => {
				setValue(e.target.value);
				handleChange(e.target.value);
			}}
		/>
	);
}
*/
