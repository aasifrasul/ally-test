import { useEffect } from 'react';
import { handleAsyncCalls } from '../utils/AsyncUtil';

interface AsyncFn<T> {
	(): Promise<T>;
}

function useAsync<T>(
	asyncFn: AsyncFn<T>,
	onSuccess?: (data: T) => void,
	onError?: (error: Error) => void,
): void {
	useEffect(() => {
		const executeAsyncFunc = async () => {
			const result = await handleAsyncCalls(asyncFn);

			if (!result.success) {
				if (onError) {
					onError(
						result.error instanceof Error
							? result.error
							: new Error(String(result.error)),
					);
				}
				return;
			} else {
				if (onSuccess) {
					onSuccess(result.data as T);
				}
			}
		};

		executeAsyncFunc();
	}, [asyncFn, onSuccess, onError]);
}

export default useAsync;
