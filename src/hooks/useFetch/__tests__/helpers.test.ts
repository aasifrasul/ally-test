import {
	buildRequestOptions,
	buildUrl,
	executeWithRetry,
	handleError,
	normalizeResult,
	requestWithRetry,
	startPolling,
} from '../helpers';
import { HTTPMethod } from '../../../types/api';

describe('useFetch helpers', () => {
	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it('builds URLs with default and page query parameters', () => {
		expect(buildUrl('https://api.test/items', { sort: 'desc' }, 2)).toBe(
			'https://api.test/items?sort=desc&page=2',
		);
	});

	it('merges request headers with caller headers taking precedence', () => {
		expect(
			buildRequestOptions(
				{ Authorization: 'caller-token' },
				{ Authorization: 'source-token', 'X-Source': 'source' },
				HTTPMethod.POST,
				'{}',
			),
		).toEqual({
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'caller-token',
				'X-Source': 'source',
			},
			method: HTTPMethod.POST,
			body: '{}',
		});
	});

	it('normalizes raw and result-shaped responses', () => {
		expect(normalizeResult({ value: 1 })).toEqual({ success: true, data: { value: 1 } });
		expect(normalizeResult({ success: false, error: new Error('failed') })).toEqual({
			success: false,
			error: expect.any(Error),
		});
	});

	it('retries a failed operation before succeeding', async () => {
		const operation = jest
			.fn()
			.mockRejectedValueOnce(new Error('temporary'))
			.mockResolvedValue('done');

		await expect(
			executeWithRetry(operation, { retry: 1, retryDelay: () => 0 }),
		).resolves.toBe('done');
		expect(operation).toHaveBeenCalledTimes(2);
	});

	it('returns a failed result after transport retries are exhausted', async () => {
		const transport = jest.fn().mockRejectedValue(new Error('offline'));

		await expect(
			requestWithRetry(
				transport,
				'https://api.test/items',
				{ method: HTTPMethod.GET },
				1000,
				{ retry: 1, retryDelay: () => 0 },
			),
		).resolves.toEqual({ success: false, error: expect.any(Error) });
		expect(transport).toHaveBeenCalledTimes(2);
	});

	it('retries API error results and returns the successful response', async () => {
		const transport = jest
			.fn()
			.mockResolvedValueOnce({ success: false, error: new Error('retry') })
			.mockResolvedValueOnce({ value: 'ok' });

		await expect(
			requestWithRetry(
				transport,
				'https://api.test/items',
				{ method: HTTPMethod.GET },
				1000,
				{ retry: 1, retryDelay: () => 0 },
			),
		).resolves.toEqual({ success: true, data: { value: 'ok' } });
	});

	it('polls only while online and visible', () => {
		const callback = jest.fn();
		let intervalCallback: (() => void) | undefined;
		const windowRef = {
			setInterval: jest.fn((fn: () => void) => {
				intervalCallback = fn;
				return 7;
			}),
		} as unknown as Window;
		const documentState = { visibilityState: 'visible' };
		const navigatorState = { onLine: true };
		const documentRef = documentState as unknown as Document;
		const navigatorRef = navigatorState as unknown as Navigator;

		expect(startPolling(100, callback, windowRef, documentRef, navigatorRef)).toBe(7);
		intervalCallback?.();
		expect(callback).toHaveBeenCalledTimes(1);

		navigatorState.onLine = false;
		intervalCallback?.();
		expect(callback).toHaveBeenCalledTimes(1);

		navigatorState.onLine = true;
		documentState.visibilityState = 'hidden';
		intervalCallback?.();
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('does not create polling when the interval is disabled', () => {
		const windowRef = { setInterval: jest.fn() } as unknown as Window;

		expect(startPolling(0, jest.fn(), windowRef)).toBeUndefined();
		expect(startPolling(undefined, jest.fn(), windowRef)).toBeUndefined();
		expect(windowRef.setInterval).not.toHaveBeenCalled();
	});

	it('suppresses abort errors', () => {
		const fail = jest.fn();
		const callback = jest.fn();
		const error = new Error('cancelled');
		error.name = 'AbortError';

		handleError(error, fail, callback);

		expect(fail).not.toHaveBeenCalled();
		expect(callback).not.toHaveBeenCalled();
	});
});
