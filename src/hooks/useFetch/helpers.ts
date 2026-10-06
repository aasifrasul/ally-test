import { buildQueryParams, withTimeout } from '../../utils/common';
import { HTTPMethod, Result } from '../../types/api';
import { isObject, isUndefined } from '../../utils/typeChecking';

export interface RetryConfig {
	retry: number;
	retryDelay: (attempt: number) => number;
}

export type FetchTransport = (
	url: string,
	options: RequestInit & { method: HTTPMethod; body?: any },
) => Promise<unknown>;

export function handleError(error: Error, fail: () => void, callback?: (err: Error) => void) {
	if (error.name !== 'AbortError') {
		fail();
		callback?.(error);
	}
}

export function buildUrl(
	endpoint: string,
	queryParams?: Record<string, unknown>,
	page?: number,
): string {
	const mergedQueryParams = {
		...(queryParams ?? {}),
		...(page !== undefined ? { page } : {}),
	};

	return `${endpoint}?${buildQueryParams(mergedQueryParams)}`;
}

export function buildRequestOptions(
	requestHeaders: Record<string, string> | undefined,
	dataSourceHeaders: Record<string, string> | undefined,
	method: HTTPMethod,
	body?: string,
): RequestInit & { method: HTTPMethod; body?: string } {
	return {
		headers: {
			'Content-Type': 'application/json',
			...(dataSourceHeaders ?? {}),
			...(requestHeaders ?? {}),
		},
		method,
		...(body !== undefined ? { body } : {}),
	};
}

export function normalizeResult<T>(value: unknown): Result<T> {
	if (value && isObject(value) && 'success' in value) {
		return value as Result<T>;
	}

	return { success: true, data: value as T };
}

export async function executeWithRetry<T>(
	operation: (attempt: number) => Promise<T>,
	{ retry, retryDelay }: RetryConfig,
): Promise<T> {
	let attempt = 0;

	while (true) {
		try {
			return await operation(attempt);
		} catch (error) {
			if (attempt >= retry) {
				throw error;
			}

			const delay = retryDelay(attempt + 1);
			await new Promise((resolve) => setTimeout(resolve, delay));
			attempt += 1;
		}
	}
}

export async function requestWithRetry<T>(
	transport: FetchTransport,
	url: string,
	requestOptions: RequestInit & { method: HTTPMethod; body?: any },
	timeout: number,
	retryConfig: RetryConfig,
): Promise<Result<T>> {
	try {
		return await executeWithRetry(async () => {
			const response = await withTimeout(transport(url, requestOptions), timeout);
			const result = normalizeResult<T>(response);

			if (!result.success) throw result.error;
			return result;
		}, retryConfig);
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

export function startPolling(
	intervalMs: number | undefined,
	callback: () => void,
	windowRef: Window | undefined = isUndefined(globalThis.window)
		? undefined
		: globalThis.window,
	documentRef: Document | undefined = isUndefined(globalThis.document)
		? undefined
		: globalThis.document,
	navigatorRef: Navigator | undefined = isUndefined(globalThis.navigator)
		? undefined
		: globalThis.navigator,
): number | undefined {
	if (!intervalMs || intervalMs <= 0 || !windowRef) return undefined;

	return windowRef.setInterval(() => {
		if (navigatorRef && 'onLine' in navigatorRef && !navigatorRef.onLine) return;
		if (documentRef && documentRef.visibilityState === 'hidden') return;
		callback();
	}, intervalMs);
}
