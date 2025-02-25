import { useState, useCallback } from 'react';

/**
 * A custom hook for managing asynchronous action states in React
 * @param {Function} actionFn - Async function to execute
 * @returns {Object} Action state and control functions
 */

enum ActionStatus {
	Idle = 'idle',
	Loading = 'loading',
	Success = 'success',
	Error = 'error',
}

export const useActionState = <T, Args extends any[] = []>(
	actionFn: (...args: Args) => Promise<T>,
) => {
	const [status, setStatus] = useState<ActionStatus>(ActionStatus.Idle);
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<Error | null>(null);

	const execute = useCallback(
		async (...args: Args) => {
			try {
				setStatus(ActionStatus.Loading);
				setError(null);

				const result = await actionFn(...args);

				setData(result);
				setStatus(ActionStatus.Success);
				return result;
			} catch (err) {
				setError(err as Error);
				setStatus(ActionStatus.Error);
				throw err;
			}
		},
		[actionFn],
	);

	const reset = useCallback(() => {
		setStatus(ActionStatus.Idle);
		setData(null);
		setError(null);
	}, []);

	return {
		status,
		data,
		error,
		execute,
		reset,
		isLoading: status === ActionStatus.Loading,
		isSuccess: status === ActionStatus.Success,
		isError: status === ActionStatus.Error,
		isIdle: status === ActionStatus.Idle,
	};
};
