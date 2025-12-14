import { useCallback } from 'react';

import { useCallbackRef, useTimeout } from '../';

type DebouncedCallback<A extends any[]> = ((...args: A) => void) & {
	cancel: () => void;
	flush: (...args: A) => void;
};

export function useDebouncedCallback<A extends any[]>(
	callback: (...args: A) => void,
	wait: number = 0,
): DebouncedCallback<A> {
	const callbackRef = useCallbackRef(callback);
	const { set, cancel } = useTimeout();

	const debouncedCallback = useCallback(
		(...args: A): void => {
			cancel();
			wait <= 0
				? callbackRef.current(...args)
				: set(() => callbackRef.current(...args), wait);
		},
		[wait, cancel, set, callbackRef],
	) as DebouncedCallback<A>;

	const flush = useCallback((...args: A): void => {
		callbackRef.current(...args);
	}, []);

	debouncedCallback.cancel = () => cancel();
	debouncedCallback.flush = (...args: A) => flush(args);

	return debouncedCallback;
}

/*
// Usage Example:
function MyComponent() {
	const [value, setValue] = useState('');

	const { debouncedCallback: debouncedAPI } = useDebouncedCallback((newValue: string) => {
		makeAPICall(newValue);
	}, 500);

	return (
		<input
			value={value}
			onChange={(e) => {
				const newValue = e.target.value;
				setValue(newValue);        // Instant UI update
				debouncedAPI(newValue);    // Debounced API call
			}}
		/>
	);
}

The alternative would be using useMemo with a library's debounce:
const debouncedAPI = useMemo(
	() => debounce((val: string) => makeAPICall(val), 500),
	[]
);
*/
