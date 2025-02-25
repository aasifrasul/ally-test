import { useState, useCallback } from 'react';
import { ApiClient } from '..';
import { ApiResponse } from '../types';

export function useApi<T>() {
	const [state, setState] = useState<ApiResponse<T>>({
		data: null,
		error: null,
		isLoading: false,
	});

	const execute = useCallback(async (endpoint: string, options: RequestInit = {}) => {
		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const apiClient = new ApiClient();
			const data = await apiClient.request<T>(endpoint, options);
			setState({ data: data ?? null, error: null });
			return data;
		} catch (error) {
			const apiError = error instanceof Error ? error : new Error('Unknown error');
			setState({ data: null, error: apiError });
			throw apiError;
		} finally {
			setState((prev) => ({ ...prev, isLoading: false }));
		}
	}, []);

	return { ...state, execute };
}
