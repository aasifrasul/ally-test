import { useEffect, useState, useMemo, useCallback } from 'react';

interface FetchDataProps<T> {
	url: string;
	options?: RequestInit;
	initialData?: T | null;
	method?: string;
	responseType?: 'json' | 'text' | 'blob';
	dependencies?: any[];
	onSuccess?: (data: T) => void;
	onError?: (error: Error) => void;
}

export const useFetchData = <T>({
	url,
	options = {},
	initialData = null,
	method = 'GET',
	responseType = 'json',
	dependencies = [],
	onSuccess,
	onError,
}: FetchDataProps<T>) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [data, setData] = useState<T | null>(initialData);

	// Stringify options to ensure stable comparison
	const memoizedOptions = useMemo(
		() => ({
			...options,
			method,
			headers: {
				'Content-Type': 'application/json',
				...(options?.headers || {}),
			},
		}),
		[method, JSON.stringify(options)],
	);

	const parseResponse = async (response: Response) => {
		switch (responseType) {
			case 'json':
				return response.json();
			case 'text':
				return response.text();
			case 'blob':
				return response.blob();
			default:
				return response.json();
		}
	};

	const fetchData = useCallback(
		async (abortController?: AbortController) => {
			setError(null);
			setIsLoading(true);

			try {
				const response = await fetch(url, {
					...memoizedOptions,
					signal: abortController?.signal,
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const result = await parseResponse(response);
				setData(result);
				onSuccess?.(result);
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					const errorObj = error as Error;
					setError(errorObj);
					console.error('Failed to fetch data:', errorObj);
					onError?.(errorObj);
				}
			} finally {
				setIsLoading(false);
			}
		},
		[url, memoizedOptions, responseType, onSuccess, onError],
	);

	// Stable refetch function
	const refetch = useCallback(() => {
		fetchData();
	}, [fetchData]);

	// Main effect with stable dependencies
	useEffect(() => {
		const abortController = new AbortController();
		fetchData(abortController);

		return () => {
			abortController.abort();
		};
	}, [fetchData, ...dependencies]);

	return {
		isLoading,
		error,
		data,
		refetch,
	};
};

// Usage:
/**
 * const { data, isLoading, error, refetch } = useFetchData<User[]>({
    url: '/api/users',
    responseType: 'json',
    dependencies: [someValue], // Will refetch when someValue changes
    onSuccess: (data) => console.log('Data fetched:', data),
    onError: (error) => console.error('Failed:', error),
});
*/
