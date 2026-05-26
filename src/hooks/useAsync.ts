import { useState, useCallback } from 'react';

export function useAsync<T extends (...args: any[]) => Promise<any>>(fn: T) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const run = useCallback(
		async (...args: Parameters<T>) => {
			setLoading(true);
			setError(null);
			try {
				return await fn(...args);
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)));
			} finally {
				setLoading(false);
			}
		},
		[fn],
	);

	return { run, loading, error };
}
