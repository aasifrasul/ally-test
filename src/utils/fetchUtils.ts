import { HTTPMethod, ResponseLike, Result, HTTPError } from '../types/api';
import { handleAsyncExecution } from '../utils/common';
import { isUndefined } from './typeChecking';

export function isResponseLike(obj: unknown): obj is ResponseLike {
	return (
		obj !== null &&
		(typeof obj === 'object' || typeof obj === 'function') &&
		'ok' in obj &&
		typeof (obj as any).ok === 'boolean' &&
		typeof (obj as any).json === 'function' &&
		typeof (obj as any).text === 'function'
	);
}

export async function fetchAPIData<T>(
	endpoint: string,
	options?: RequestInit,
): Promise<Result<T>> {
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

	const fetchResult = await handleAsyncExecution(() => fetch(endpoint, requestOptions));

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
		? handleAsyncExecution(() => response.json())
		: handleAsyncExecution(() => response.text() as Promise<T>);
}
