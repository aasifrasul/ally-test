'use client';
// Types for our response handling
type SuccessResult<T> = {
	success: true;
	data: T;
};

type ErrorResult = {
	success: false;
	error: Error;
};

export type Result<T> = SuccessResult<T> | ErrorResult;

export interface ResponseLike {
	ok: boolean;
	headers?: Headers;
	status?: number;
	json(): Promise<any>;
}

export class NetworkError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NetworkError';
	}
}

export class HTTPError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = 'HTTPError';
	}
}

function isResponseLike(obj: any): obj is ResponseLike {
	return (
		obj &&
		typeof obj === 'object' &&
		'ok' in obj &&
		typeof obj.ok === 'boolean' &&
		typeof obj.json === 'function'
	);
}

export async function handleAsyncCalls<T>(promise: Promise<T>): Promise<Result<T>> {
	try {
		const data = await promise;
		return {
			success: true,
			data,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

export async function fetchAPIData<T>(url: string, options?: RequestInit): Promise<Result<T>> {
	const result = await handleAsyncCalls(fetch(url, options));

	if (!result.success) {
		return result;
	}

	const response = result.data;
	let error: Error | null = null;

	// Check if response has the required interface
	if (!isResponseLike(response)) {
		error = new Error('Expected Response-like object');
	}

	if (!response.ok) {
		const errorText = await response.text().catch(() => 'Unknown error');
		error = new Error(`HTTP Error ${response.status}: ${errorText}`);
	}

	if (error) return { success: false, error };

	return handleAsyncCalls(response.json());
}
