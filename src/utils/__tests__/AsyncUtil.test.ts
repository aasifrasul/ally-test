import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	handleAsyncCalls,
	fetchAPIData,
	NetworkError,
	HTTPError,
	ResponseLike,
} from '../AsyncUtil';

// Create mock ResponseLike
const createMockResponse = (
	ok: boolean,
	status = 200,
	body?: any,
	contentType = 'application/json',
): ResponseLike => {
	return {
		ok,
		status,
		headers: {
			get: (key: string) => (key === 'content-type' ? contentType : null),
		} as any,
		json: () => (body instanceof Error ? Promise.reject(body) : Promise.resolve(body)),
		text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
	};
};

describe('handleAsyncCalls', () => {
	it('handles successful promise', async () => {
		const res = await handleAsyncCalls(Promise.resolve(123));
		expect(res.success).toBe(true);
		if (res.success) expect(res.data).toBe(123);
	});

	it('handles normal Error', async () => {
		const res = await handleAsyncCalls(Promise.reject(new Error('x')));
		expect(res.success).toBe(false);
		if (!res.success) expect(res.error.message).toBe('x');
	});

	it('handles non-Error rejections', async () => {
		const res = await handleAsyncCalls(Promise.reject('oops'));
		expect(res.success).toBe(false);
		if (!res.success) expect(res.error.message).toBe('oops');
	});

	it('handles AbortError', async () => {
		const abortErr = new DOMException('Aborted', 'AbortError');
		const res = await handleAsyncCalls(Promise.reject(abortErr));

		expect(res.success).toBe(false);
		if (!res.success) {
			expect(res.error).toBeInstanceOf(NetworkError);
			expect(res.error.message).toBe('Request aborted');
		}
	});

	it('handles TypeError as NetworkError', async () => {
		const res = await handleAsyncCalls(Promise.reject(new TypeError('Network failed')));
		expect(!res.success).toBe(true);
		if (!res.success) {
			expect(res.error).toBeInstanceOf(NetworkError);
			expect(res.error.message).toBe('Network failed');
		}
	});
});

describe('fetchAPIData', () => {
	beforeEach(() => {
		globalThis.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns JSON data on success', async () => {
		(globalThis.fetch as any).mockResolvedValue(
			createMockResponse(true, 200, { msg: 'ok' }),
		);

		const result = await fetchAPIData<{ msg: string }>('test');

		expect(result).toEqual({ success: true, data: { msg: 'ok' } });
	});

	it('returns text when content-type is not json', async () => {
		(globalThis.fetch as any).mockResolvedValue(
			createMockResponse(true, 200, 'hello', 'text/plain'),
		);

		const res = await fetchAPIData<string>('test');
		expect(res.success).toBe(true);
		if (res.success) expect(res.data).toBe('hello');
	});

	it('returns error when fetch rejects', async () => {
		(globalThis.fetch as any).mockRejectedValue(new Error('fetch failed'));

		const res = await fetchAPIData('url');
		expect(res.success).toBe(false);
		if (!res.success) {
			expect(res.error).toBeInstanceOf(Error);
			expect(res.error.message).toBe('fetch failed');
		}
	});

	it('returns error when response is not ResponseLike', async () => {
		(globalThis.fetch as any).mockResolvedValue({ not: 'response' });

		const res = await fetchAPIData('url');
		expect(res.success).toBe(false);
		if (!res.success) expect(res.error.message).toBe('Expected Response-like object');
	});

	it('handles HTTP error and returns HTTPError', async () => {
		(globalThis.fetch as any).mockResolvedValue({
			...createMockResponse(false, 404),
			text: () => Promise.resolve('Not Found'),
		});

		const res = await fetchAPIData('url');
		expect(res.success).toBe(false);
		if (!res.success) {
			expect(res.error).toBeInstanceOf(HTTPError);
			expect(res.error.message).toBe('Not Found');
		}
	});

	it('handles malformed JSON', async () => {
		(globalThis.fetch as any).mockResolvedValue({
			...createMockResponse(true, 200),
			json: () => Promise.reject(new SyntaxError('bad json')),
		});

		const res = await fetchAPIData('url');
		expect(res.success).toBe(false);
		if (!res.success) {
			expect(res.error.message).toContain('bad json');
		}
	});

	it('handles empty JSON', async () => {
		(globalThis.fetch as any).mockResolvedValue(createMockResponse(true, 200, null));

		const res = await fetchAPIData('url');
		expect(res.success).toBe(true);
		if (res.success) expect(res.data).toBeNull();
	});

	it('passes custom headers', async () => {
		(globalThis.fetch as any).mockResolvedValue(
			createMockResponse(true, 200, 'ok', 'text/plain'),
		);

		await fetchAPIData('url', { headers: { Authorization: 'token' } });

		expect(globalThis.fetch).toHaveBeenCalledWith('url', {
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'token',
			},
		});
	});
});
