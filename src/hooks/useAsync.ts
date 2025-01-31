import { useEffect } from 'react';

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
			try {
				const data = await asyncFn();
				if (onSuccess) {
					onSuccess(data);
				}
			} catch (err) {
				if (onError) {
					onError(err instanceof Error ? err : new Error(String(err)));
				}
			}
		};

		executeAsyncFunc();
	}, [asyncFn, onSuccess, onError]);
}

export default useAsync;
