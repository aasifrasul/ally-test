//import { describe, it, expect } from 'vitest';
import { fetchAPIData, handleAsyncCalls, ResponseLike } from '../handleAsyncCalls';

const createMockResponse = (
	status: number,
	body: any = {},
	ok = status >= 200 && status < 300,
): ResponseLike => ({
	ok,
	status,
	json: () => Promise.resolve(body),
});

describe('handleAsyncCalls', () => {
	// Helper functions for testing
	const createSuccessPromise = <T>(data: T): Promise<T> => {
		return Promise.resolve(data);
	};

	const createFailurePromise = (message: string): Promise<never> => {
		return Promise.reject(new Error(message));
	};

	it('should handle successful promises', async () => {
		// Test with different data types
		const testCases = [
			{ input: 42, description: 'number' },
			{ input: 'test', description: 'string' },
			{ input: { key: 'value' }, description: 'object' },
			{ input: [1, 2, 3], description: 'array' },
		];

		for (const { input, description } of testCases) {
			const result = await handleAsyncCalls(createSuccessPromise(input));

			expect(result.success).toBe(true);
			expect('data' in result).toBe(true);
			if (result.success) {
				// Type guard
				expect(result.data).toEqual(input);
			}
		}
	});

	it('should handle failed promises', async () => {
		const errorMessage = 'Test error message';
		const result = await handleAsyncCalls(createFailurePromise(errorMessage));

		expect(result.success).toBe(false);
		expect('error' in result).toBe(true);
		if (!result.success) {
			// Type guard
			expect(result.error).toBeInstanceOf(Error);
			expect(result.error.message).toBe(errorMessage);
		}
	});

	it('should handle non-Error rejections', async () => {
		const testCases = [
			{ input: 'string error', description: 'string rejection' },
			{ input: 42, description: 'number rejection' },
			{ input: { custom: 'error' }, description: 'object rejection' },
			{ input: null, description: 'null rejection' },
		];

		for (const { input, description } of testCases) {
			const result = await handleAsyncCalls(Promise.reject(input));

			expect(result.success).toBe(false);
			if (!result.success) {
				// Type guard
				expect(result.error).toBeInstanceOf(Error);
				expect(result.error.message).toBe(String(input));
			}
		}
	});

	it('should handle async operations', async () => {
		const asyncOperation = async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
			return 'async result';
		};

		const result = await handleAsyncCalls(asyncOperation());

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe('async result');
		}
	});

	it('should handle nested promises', async () => {
		const nestedPromise = async () => {
			const inner = await Promise.resolve(42);
			return Promise.resolve(inner * 2);
		};

		const result = await handleAsyncCalls(nestedPromise());

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe(84);
		}
	});

	it('should maintain type safety', async () => {
		interface User {
			id: number;
			name: string;
		}

		const user: User = { id: 1, name: 'Test User' };
		const result = await handleAsyncCalls(Promise.resolve(user));

		if (result.success) {
			// TypeScript should recognize these properties exist
			expect(result.data.id).toBe(1);
			expect(result.data.name).toBe('Test User');
		}
	});

	it('should handle undefined/void returns', async () => {
		const voidPromise = new Promise<void>((resolve) => resolve());
		const result = await handleAsyncCalls(voidPromise);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBeUndefined();
		}
	});

	it('should handle special objects', async () => {
		const date = new Date();
		const regex = /test/;
		const map = new Map([['key', 'value']]);

		const results = await Promise.all([
			handleAsyncCalls(Promise.resolve(date)),
			handleAsyncCalls(Promise.resolve(regex)),
			handleAsyncCalls(Promise.resolve(map)),
		]);

		results.forEach((result) => {
			expect(result.success).toBe(true);
		});
	});

	it('should handle custom error types', async () => {
		class CustomError extends Error {
			constructor(
				message: string,
				public code: number,
			) {
				super(message);
				this.name = 'CustomError';
			}
		}

		const result = await handleAsyncCalls(
			Promise.reject(new CustomError('Custom error', 123)),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(CustomError);
			expect(result.error.name).toBe('CustomError');
			if (result.error instanceof CustomError) {
				expect(result.error.code).toBe(123);
			}
		}
	});
});

describe('fetchAPIData', () => {
	it('should return success with data on successful API call', async () => {
		const mockResponse = {
			ok: true,
			json: () => Promise.resolve({ message: 'success' }),
		};

		const promise = Promise.resolve(mockResponse);
		const result = await fetchAPIData(promise);
		expect(result).toEqual({ success: true, data: { message: 'success' } });
	});

	it('should return failure if handleAsyncCalls fails', async () => {
		const mockResponse = {
			ok: true,
			json: () => Promise.reject(new Error('json error')),
		};

		const promise = Promise.resolve(mockResponse);
		const result = await fetchAPIData(promise);
		expect(result).toEqual({ success: false, error: new Error('json error') });
	});

	it('should return failure if data is not a Response object', async () => {
		const promise = Promise.resolve({
			ok: true,
			json: () => Promise.reject('Expected Response object'),
		});

		const result = await fetchAPIData(promise);
		expect(result).toEqual({
			success: false,
			error: new Error('Expected Response object'),
		});
	});

	it('should return failure if response status is not ok', async () => {
		const mockResponse = { ok: false, status: 404, json: () => Promise.resolve({}) };
		const promise = Promise.resolve(mockResponse);
		const result = await fetchAPIData(promise);
		expect(result).toEqual({
			success: false,
			error: new Error('HTTP error! status: 404'),
		});
	});

	it('should handle various HTTP status codes', async () => {
		const statusCodes = [401, 403, 404, 500, 503];

		for (const status of statusCodes) {
			const response = createMockResponse(status);
			const result = await fetchAPIData(Promise.resolve(response));

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain(String(status));
			}
		}
	});

	it('should handle empty response bodies', async () => {
		const response = {
			ok: true,
			json: () => Promise.resolve(null),
		};

		const result = await fetchAPIData(Promise.resolve(response));
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBeNull();
		}
	});

	it('should handle malformed JSON responses', async () => {
		const response = {
			ok: true,
			json: () => Promise.reject(new SyntaxError('Unexpected token')),
		};

		const result = await fetchAPIData(Promise.resolve(response));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(Error);
			expect(result.error.message).toContain('Unexpected token');
		}
	});

	it('should handle responses with headers', async () => {
		const headers = new Map([
			['content-type', 'application/json'],
			['x-custom-header', 'test'],
		]);

		const response = {
			ok: true,
			status: 200,
			headers,
			json: () => Promise.resolve({ data: 'test' }),
		};

		const result = await fetchAPIData(Promise.resolve(response));
		expect(result.success).toBe(true);
	});
});
