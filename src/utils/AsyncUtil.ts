import { HTTPMethod } from '../types/api';
import { isBoolean, isFunction, isUndefined } from './typeChecking';

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
	headers: Headers; // Remove null, Response always has headers
	status: number; // Remove optional, always present
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
		isBoolean(obj.ok) &&
		isFunction(obj.json) &&
		isFunction(obj.text)
	);
}

export async function handleAsyncCalls<T>(operation: () => Promise<T>): Promise<Result<T>> {
	try {
		const data = await operation();
		return { success: true, data };
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
	const { method, body } = options || {};
	const inferredMethod = method || (!isUndefined(body) ? HTTPMethod.POST : HTTPMethod.GET);

	const requestOptions: RequestInit = {
		...options,
		method: inferredMethod,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers,
		},
	};

	const fetchResult = await handleAsyncCalls(() => fetch(url, requestOptions));

	if (!fetchResult.success) return fetchResult;

	const response = fetchResult.data;

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
			error: new HTTPError(response.status ?? 0, errorText),
		};
	}

	const contentType = response.headers?.get('content-type') ?? '';

	return contentType.includes('application/json')
		? handleAsyncCalls(() => response.json())
		: handleAsyncCalls(() => response.text() as Promise<T>);
}
