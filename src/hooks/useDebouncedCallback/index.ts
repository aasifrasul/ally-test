import { useCallback } from 'react';

import { useCallbackRef } from '../useCallbackRef';
import { useTimeout } from '../useTimeout';

export function useDebouncedCallback<A extends any[]>(
	callback: (...args: A) => void,
	wait: number = 0,
) {
	const callbackRef = useCallbackRef(callback);
	const { set, cancel } = useTimeout();

	const debouncedCallback = useCallback(
		(...args: A): void => {
			cancel();
			if (wait <= 0) {
				callbackRef.current(...args);
			} else {
				set(() => callbackRef.current(...args), wait);
			}
		},
		[wait, cancel, set, callbackRef],
	);

	return { debouncedCallback, cancel };
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
