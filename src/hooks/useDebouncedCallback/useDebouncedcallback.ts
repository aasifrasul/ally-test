import { useEffect, useRef } from 'react';

export function useDebouncedCallback<A extends any[]>(
	callback: (...args: A) => void,
	wait: number,
) {
	// Store latest callback and args
	const callbackRef = useRef(callback);
	const argsRef = useRef<A | undefined>(undefined);
	const timeout = useRef<NodeJS.Timeout | null>(null);

	// Keep callback ref updated
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timeout.current) {
				clearTimeout(timeout.current);
			}
		};
	}, []);

	return function debouncedCallback(...args: A) {
		argsRef.current = args;

		// Clear existing timeout
		if (timeout.current) {
			clearTimeout(timeout.current);
		}

		// Set new timeout
		timeout.current = setTimeout(() => {
			if (argsRef.current) {
				callbackRef.current(...argsRef.current);
			}
		}, wait);
	};
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
