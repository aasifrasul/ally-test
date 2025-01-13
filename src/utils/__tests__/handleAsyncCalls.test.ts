//import { describe, it, expect } from 'vitest';
import { handleAsyncCalls } from '../handleAsyncCalls';

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
});
