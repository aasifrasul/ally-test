import { useState, useCallback, useMemo } from 'react';
import { handleAsyncCalls } from '../../utils/AsyncUtil';

interface AsyncState<T> {
	data: T | null;
	isLoading: boolean;
	error: Error | null;
}

interface AsyncStateActions<T> {
	setData: (data: T | null) => void;
	setIsLoading: (loading: boolean) => void;
	setError: (error: Error | null) => void;
	reset: () => void;
	updateData: (updater: (prev: T | null) => T | null) => void;
	handleAsyncOperation: (
		operation: () => Promise<T>,
		options?: {
			onSuccess?: (data: T) => void;
			onFailure?: (error: Error) => void;
		},
	) => Promise<T>;
}

export function useAsyncState<T>(
	initialLoading: boolean = false,
): [AsyncState<T>, AsyncStateActions<T>] {
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(initialLoading);
	const [error, setError] = useState<Error | null>(null);

	const reset = useCallback(() => {
		setData(null);
		setIsLoading(false);
		setError(null);
	}, []);

	const updateData = useCallback((updater: (prev: T | null) => T | null) => {
		setData((prev) => updater(prev));
	}, []);

	const handleAsyncOperation = useCallback(
		async (
			operation: () => Promise<T>,
			options?: {
				onSuccess?: (data: T) => void;
				onFailure?: (error: Error) => void;
			},
		): Promise<T> => {
			setIsLoading(true);
			setError(null);

			const result = await handleAsyncCalls(operation); // Fixed: pass function, not promise

			if (result.success) {
				setData(result.data);
				setIsLoading(false);
				options?.onSuccess?.(result.data);
				return result.data;
			} else {
				const errorObj =
					result.error instanceof Error
						? result.error
						: new Error('Async operation failed');
				setError(errorObj);
				setIsLoading(false);
				options?.onFailure?.(errorObj);
				throw errorObj;
			}
		},
		[],
	);

	// Memoize actions to prevent re-renders
	const actions = useMemo(
		() => ({
			setData,
			setIsLoading,
			setError,
			reset,
			updateData,
			handleAsyncOperation,
		}),
		[reset, updateData, handleAsyncOperation],
	);

	return [{ data, isLoading, error }, actions as AsyncStateActions<T>];
}
