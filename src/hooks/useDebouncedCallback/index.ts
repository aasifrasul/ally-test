import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<A extends any[]>(
	callback: (...args: A) => void,
	wait: number,
) {
	const callbackRef = useRef(callback);
	const argsRef = useRef<A>(null);
	const timeout = useRef<NodeJS.Timeout>(null);

	// Keep callback ref updated
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// Cleanup on unmount
	useEffect(() => {
		return cancel;
	}, []);

	const debouncedCallback = useCallback(
		(...args: A) => {
			argsRef.current = args;

			cancel();

			timeout.current = setTimeout(() => {
				if (argsRef.current) {
					callbackRef.current(...argsRef.current);
				}
			}, wait);
		},
		[wait],
	);

	const cancel = useCallback(() => {
		if (timeout.current) {
			clearTimeout(timeout.current);
		}
	}, []);

	return { debouncedCallback, cancel };
}

/*
// Usage Example:
function MyComponent() {
	const [value, setValue] = useState('');

	const handleChange = useDebouncedCallback((newValue: string) => {
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
