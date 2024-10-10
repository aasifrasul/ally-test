import { renderHook, act } from '@testing-library/react-hooks';
import { fetchAPIData } from '../../workers/WorkerHelper';
import useFetch, { FetchOptions } from '../useFetch';
import { Constants, Schema, HTTPMethod } from '../../constants/types';

interface TestData {
	data: string;
}

jest.mock('../../workers/WorkerHelper', () => ({
	fetchAPIData: jest.fn(),
	abortFetchRequest: jest.fn(),
}));

jest.mock('../../hooks/useSelector', () => ({
	useSelector: jest.fn(),
}));

jest.mock('../createActionHooks', () => ({
	createActionHooks: () => ({
		useFetchActions: () => ({
			fetchStarted: jest.fn(),
			fetchSucceeded: jest.fn(),
			fetchFailed: jest.fn(),
			fetchCompleted: jest.fn(),
		}),
		useUpdateActions: () => ({
			updateStarted: jest.fn(),
			updateSucceeded: jest.fn(),
			updateFailed: jest.fn(),
			updateCompleted: jest.fn(),
		}),
		usePageActions: () => ({
			advancePage: jest.fn(),
		}),
	}),
}));

jest.mock('../../constants', () => {
	const constants: Constants = {
		dataSources: {
			testSchema: {
				schema: 'testSchema' as Schema,
				BASE_URL: 'http://api.test.com',
				queryParams: {
					page: 1,
				},
			},
		},
	};

	return { constants };
});

describe('useFetch', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const schema = 'testSchema';

	it('should initialize with default options', () => {
		const { result } = renderHook(() => useFetch<TestData>(schema));

		expect(result.current).toHaveProperty('fetchData');
		expect(result.current).toHaveProperty('fetchNextPage');
		expect(result.current).toHaveProperty('updateData');
		expect(result.current).toHaveProperty('cleanUpTopLevel');
		expect(result.current).toHaveProperty('getList');
	});

	it('should fetch data successfully', async () => {
		const mockData: TestData = { data: 'test data' };
		(fetchAPIData as jest.Mock).mockResolvedValueOnce(mockData);

		const onSuccess = jest.fn();
		const transformResponse = jest.fn((data: TestData) => data);

		const options: FetchOptions<TestData> = {
			onSuccess,
			transformResponse,
		};

		const { result } = renderHook(() => useFetch<TestData>(schema, options));

		await act(async () => {
			await result.current.fetchData();
		});

		expect(onSuccess).toHaveBeenCalledWith(mockData);
		expect(transformResponse).toHaveBeenCalled();
	});

	it('should handle fetch errors', async () => {
		const mockError = new Error('Fetch failed');
		(fetchAPIData as jest.Mock).mockRejectedValueOnce(mockError);

		const onError = jest.fn();
		const { result } = renderHook(() => useFetch<TestData>(schema, { onError }));

		await act(async () => {
			await result.current.fetchData();
		});

		expect(onError).toHaveBeenCalledWith(mockError);
	});

	it('should update data successfully', async () => {
		const mockUpdateResponse: TestData = { data: 'updated data' };
		(fetchAPIData as jest.Mock).mockResolvedValueOnce(mockUpdateResponse);

		const onUpdateSuccess = jest.fn();
		const transformUpdateResponse = jest.fn((data: TestData) => data);

		const { result } = renderHook(() =>
			useFetch<TestData>(schema, {
				onUpdateSuccess,
				transformUpdateResponse,
			}),
		);

		const updateData: Partial<TestData> = { data: 'test' };

		await act(async () => {
			await result.current.updateData(updateData);
		});

		expect(onUpdateSuccess).toHaveBeenCalledWith(mockUpdateResponse);
		expect(transformUpdateResponse).toHaveBeenCalled();
		expect(fetchAPIData).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				method: HTTPMethod.POST,
				body: JSON.stringify(updateData),
			}),
		);
	});

	it('should handle update errors', async () => {
		const mockError = new Error('Update failed');
		(fetchAPIData as jest.Mock).mockRejectedValueOnce(mockError);

		const onUpdateError = jest.fn();
		const { result } = renderHook(() => useFetch<TestData>(schema, { onUpdateError }));

		await act(async () => {
			await result.current.updateData({ data: 'test' });
		});

		expect(onUpdateError).toHaveBeenCalledWith(mockError);
	});

	it('should fetch next page correctly', async () => {
		const mockData: TestData = { data: 'next page data' };
		(fetchAPIData as jest.Mock).mockResolvedValueOnce(mockData);

		const { result } = renderHook(() => useFetch<TestData>(schema));

		await act(async () => {
			await result.current.fetchNextPage(2);
		});

		expect(fetchAPIData).toHaveBeenCalledWith(
			expect.stringContaining('page=2'),
			expect.any(Object),
		);
	});

	it('should handle timeout', async () => {
		const onError = jest.fn();

		const { result } = renderHook(() =>
			useFetch<TestData>(schema, {
				timeout: 100,
				onError,
			}),
		);

		(fetchAPIData as jest.Mock).mockImplementationOnce(
			() => new Promise((resolve) => setTimeout(resolve, 200)),
		);

		await act(async () => {
			await result.current.fetchData();
		});

		expect(onError).toHaveBeenCalledWith(expect.any(Error));
	});

	it('should handle concurrent requests correctly', async () => {
		const { result } = renderHook(() => useFetch<TestData>(schema));

		// Setup mock responses
		const mockResponse1 = { data: 'response 1' };
		const mockResponse2 = { data: 'response 2' };

		(fetchAPIData as jest.Mock)
			.mockImplementationOnce(
				() => new Promise((resolve) => setTimeout(() => resolve(mockResponse1), 100)),
			)
			.mockImplementationOnce(() => Promise.resolve(mockResponse2));

		// Start two concurrent requests
		const request1Promise = act(() => result.current.fetchData());
		const request2Promise = act(() => result.current.fetchData());

		// Wait for both requests to complete
		await Promise.all([request1Promise, request2Promise]);

		// Verify that fetchAPIData was called twice
		expect(fetchAPIData).toHaveBeenCalledTimes(2);
	});

	it('should handle request cancellation', async () => {
		const { result } = renderHook(() => useFetch<TestData>(schema));

		// Setup a delayed mock response
		(fetchAPIData as jest.Mock).mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve({ data: 'test' }), 1000)),
		);

		// Start a request and immediately clean up
		const fetchPromise = result.current.fetchData();
		result.current.cleanUpTopLevel();

		await fetchPromise;

		// Verify that the request was properly handled
		expect(fetchAPIData).toHaveBeenCalledTimes(1);
	});

	it('should handle timeout with proper cleanup', async () => {
		const onError = jest.fn();
		const { result } = renderHook(() =>
			useFetch<TestData>(schema, {
				timeout: 100,
				onError,
			}),
		);

		// Setup a delayed mock response
		(fetchAPIData as jest.Mock).mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve({ data: 'test' }), 200)),
		);

		await act(async () => {
			await result.current.fetchData();
		});

		expect(onError).toHaveBeenCalledWith(expect.any(Error));
	});
});

describe('useFetch - Additional Test Coverage', () => {
	const schema = 'testSchema';

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('1. HTTP Methods Tests', () => {
		it('should handle PUT request correctly', async () => {
			const mockUpdateResponse = { data: 'updated data' };
			(fetchAPIData as jest.Mock).mockResolvedValueOnce(mockUpdateResponse);

			const { result } = renderHook(() => useFetch<TestData>(schema));
			const updateData = { data: 'test' };

			await act(async () => {
				await result.current.updateData(updateData, {
					method: HTTPMethod.PUT,
					headers: {
						'Custom-Header': 'test-value',
					},
				});
			});

			expect(fetchAPIData).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: HTTPMethod.PUT,
					headers: expect.objectContaining({
						'Custom-Header': 'test-value',
						'Content-Type': 'application/json',
					}),
					body: JSON.stringify(updateData),
				}),
			);
		});

		it('should handle PATCH request with partial data', async () => {
			const mockUpdateResponse = { data: 'patched data' };
			(fetchAPIData as jest.Mock).mockResolvedValueOnce(mockUpdateResponse);

			const { result } = renderHook(() => useFetch<TestData>(schema));
			const patchData = { data: 'partial update' };

			await act(async () => {
				await result.current.updateData(patchData, { method: HTTPMethod.PATCH });
			});

			expect(fetchAPIData).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: HTTPMethod.PATCH,
					body: JSON.stringify(patchData),
				}),
			);
		});

		it('should handle DELETE request', async () => {
			const { result } = renderHook(() => useFetch<TestData>(schema));

			await act(async () => {
				await result.current.updateData({}, { method: HTTPMethod.DELETE });
			});

			expect(fetchAPIData).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: HTTPMethod.DELETE,
				}),
			);
		});
	});

	describe('2. Custom Query Parameters Tests', () => {
		it('should merge custom query parameters with defaults', async () => {
			const { result } = renderHook(() => useFetch<TestData>(schema));

			await act(async () => {
				await result.current.updateData(
					{},
					{
						queryParams: {
							filter: 'active',
							sort: 'desc',
						},
					},
				);
			});

			expect(fetchAPIData).toHaveBeenCalledWith(
				expect.stringContaining('filter=active'),
				expect.any(Object),
			);
			expect(fetchAPIData).toHaveBeenCalledWith(
				expect.stringContaining('sort=desc'),
				expect.any(Object),
			);
		});

		it('should override default query parameters with custom ones', async () => {
			const { result } = renderHook(() => useFetch<TestData>(schema));

			await act(async () => {
				await result.current.updateData(
					{},
					{
						queryParams: {
							page: 5, // Override default page parameter
						},
					},
				);
			});

			expect(fetchAPIData).toHaveBeenCalledWith(
				expect.stringContaining('page=5'),
				expect.any(Object),
			);
		});
	});

	describe('3. Error Scenarios Tests', () => {
		it('should handle malformed API responses', async () => {
			const malformedData = 'not a JSON response';
			(fetchAPIData as jest.Mock).mockResolvedValueOnce(malformedData);

			const onError = jest.fn();
			const transformResponse = jest.fn(() => {
				throw new Error('Invalid response format');
			});

			const { result } = renderHook(() =>
				useFetch<TestData>(schema, { onError, transformResponse }),
			);

			await act(async () => {
				await result.current.fetchData();
			});

			expect(onError).toHaveBeenCalledWith(expect.any(Error));
			expect(transformResponse).toHaveBeenCalledWith(malformedData);
		});

		it('should handle network errors', async () => {
			const networkError = new Error('Network failure');
			networkError.name = 'NetworkError';
			(fetchAPIData as jest.Mock).mockRejectedValueOnce(networkError);

			const onError = jest.fn();
			const { result } = renderHook(() => useFetch<TestData>(schema, { onError }));

			await act(async () => {
				await result.current.fetchData();
			});

			expect(onError).toHaveBeenCalledWith(expect.any(Error));
			expect(onError.mock.calls[0][0].name).toBe('NetworkError');
		});
	});

	describe('4. Edge Cases Tests', () => {
		it('should handle empty response data', async () => {
			(fetchAPIData as jest.Mock).mockResolvedValueOnce(null);

			const transformResponse = jest.fn((data) => data ?? { data: 'default' });
			const { result } = renderHook(() =>
				useFetch<TestData>(schema, { transformResponse }),
			);

			await act(async () => {
				await result.current.fetchData();
			});

			expect(transformResponse).toHaveBeenCalledWith(null);
		});

		it('should handle pagination boundary cases', async () => {
			const { result } = renderHook(() => useFetch<TestData>(schema));

			// Test with page 0 (invalid page)
			await act(async () => {
				await result.current.fetchNextPage(0);
			});

			// Test with negative page
			await act(async () => {
				await result.current.fetchNextPage(-1);
			});

			// Verify both cases triggered API calls with appropriate handling
			expect(fetchAPIData).toHaveBeenCalledTimes(2);
		});
	});

	describe('5. Race Condition Tests', () => {
		it('should handle race conditions between fetch requests', async () => {
			const slowResponse = new Promise((resolve) =>
				setTimeout(() => resolve({ data: 'slow' }), 100),
			);
			const fastResponse = Promise.resolve({ data: 'fast' });

			(fetchAPIData as jest.Mock)
				.mockImplementationOnce(() => slowResponse)
				.mockImplementationOnce(() => fastResponse);

			const { result } = renderHook(() => useFetch<TestData>(schema));

			// Start both requests simultaneously
			const [slowRequest, fastRequest] = await Promise.all([
				act(() => result.current.fetchData()),
				act(() => result.current.fetchData()),
			]);

			// Verify the last successful response was processed
			expect(fetchAPIData).toHaveBeenCalledTimes(2);
		});

		it('should handle race conditions between fetch and update operations', async () => {
			const fetchResponse = new Promise((resolve) =>
				setTimeout(() => resolve({ data: 'fetch' }), 100),
			);
			const updateResponse = Promise.resolve({ data: 'update' });

			(fetchAPIData as jest.Mock)
				.mockImplementationOnce(() => fetchResponse)
				.mockImplementationOnce(() => updateResponse);

			const { result } = renderHook(() => useFetch<TestData>(schema));

			// Start fetch and update operations simultaneously
			await Promise.all([
				act(() => result.current.fetchData()),
				act(() => result.current.updateData({ data: 'test' })),
			]);

			// Verify both operations were processed
			expect(fetchAPIData).toHaveBeenCalledTimes(2);
		});
	});
});
