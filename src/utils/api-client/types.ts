export interface ApiResponse<T> {
	data: T | null;
	error: Error | null;
	isLoading: boolean;
}

export interface ApiError extends Error {
	status?: number;
	data?: any;
}
