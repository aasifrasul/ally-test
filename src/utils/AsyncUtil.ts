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
	headers?: Headers | null;
	status?: number;
	json(): Promise<any>;
	text(): Promise<string>;
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
		if (error instanceof DOMException && error.name === 'AbortError') {
			return {
				success: false,
				error: new NetworkError('Request aborted'),
			};
		}

		if (error instanceof TypeError) {
			return {
				success: false,
				error: new NetworkError(error.message),
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

export async function fetchAPIData<T>(url: string, options?: RequestInit): Promise<Result<T>> {
	const newOptions = {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers,
		},
	};

	const result = await handleAsyncCalls(fetch(url, newOptions));

	if (!result.success) return result;

	const response = result.data;

	if (!isResponseLike(response)) {
		return {
			success: false,
			error: new Error('Expected Response-like object'),
		};
	}

	if (!response.ok) {
		const errorText = await response.text().catch(() => 'Unknown error');
		return {
			success: false,
			error: new HTTPError(response.status, errorText),
		};
	}

	const contentType = response.headers?.get('content-type') || '';

	if (contentType.includes('application/json')) {
		return handleAsyncCalls(response.json() as Promise<T>);
	}

	return handleAsyncCalls(response.text() as Promise<T>);
}
