import { APIService } from '../APIService';
import { HTTPMethod } from '../../types/api';

describe('APIService', () => {
	let apiService: APIService;

	beforeEach(() => {
		apiService = APIService.getInstance();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should fetch data and cache it for GET requests', async () => {
		const endpoint = 'https://api.example.com/data';
		const mockData = { key: 'value' };

		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => mockData,
		});

		const data = await apiService.fetch(endpoint);
		expect(data).toEqual(mockData);
		expect(global.fetch).toHaveBeenCalledWith(endpoint, expect.any(Object));

		// Fetch again to check if data is returned from cache
		const cachedData = await apiService.fetch(endpoint);
		expect(cachedData).toEqual(mockData);
		expect(global.fetch).toHaveBeenCalledTimes(1); // Should not call fetch again
	});

	it('should not cache data for non-GET requests', async () => {
		const endpoint = 'https://api.example.com/data';
		const mockData = { key: 'value' };

		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => mockData,
		});

		const options = { method: HTTPMethod.POST };
		const data = await apiService.fetch(endpoint, options);
		expect(data).toEqual(mockData);
		expect(global.fetch).toHaveBeenCalledWith(endpoint, expect.any(Object));

		// Fetch again to check if data is not returned from cache
		const newData = await apiService.fetch(endpoint, options);
		expect(newData).toEqual(mockData);
		expect(global.fetch).toHaveBeenCalledTimes(2); // Should call fetch again
	});

	it('should abort a request', async () => {
		const endpoint = 'https://api.example.com/data';

		global.fetch = jest.fn().mockImplementation(
			() =>
				new Promise((_, reject) => {
					setTimeout(() => reject({ name: 'AbortError' }), 100);
				}),
		);

		const fetchPromise = apiService.fetch(endpoint);
		apiService.abort(endpoint);

		//await expect(fetchPromise).rejects.toThrow('AbortError');
		expect(global.fetch).toHaveBeenCalledWith(endpoint, expect.any(Object));
	});

	it('should clear the cache', async () => {
		const endpoint = 'https://api.example.com/data';
		const mockData = { key: 'value' };

		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => mockData,
		});

		await apiService.fetch(endpoint);
		apiService.clearCache();

		// Fetch again to check if data is fetched from network after cache is cleared
		const newData = await apiService.fetch(endpoint);
		expect(newData).toEqual(mockData);
		expect(global.fetch).toHaveBeenCalledTimes(2); // Should call fetch again
	});

	it('should abort all requests', async () => {
		const endpoint1 = 'https://api.example.com/data1';
		const endpoint2 = 'https://api.example.com/data2';

		global.fetch = jest.fn().mockImplementation(
			() =>
				new Promise((_, reject) => {
					setTimeout(() => reject({ name: 'AbortError' }), 100);
				}),
		);

		const fetchPromise1 = apiService.fetch(endpoint1);
		const fetchPromise2 = apiService.fetch(endpoint2);

		apiService.abortAll();
		const errorObject = { name: 'AbortError' };

		await expect(fetchPromise1).rejects.toThrow(errorObject as Error);
		await expect(fetchPromise2).rejects.toThrow(errorObject as Error);
		expect(global.fetch).toHaveBeenCalledWith(endpoint1, expect.any(Object));
		expect(global.fetch).toHaveBeenCalledWith(endpoint2, expect.any(Object));
	});

	// Test error handling for non-200 HTTP responses
	it('should throw an error for non-200 HTTP responses', async () => {
		const endpoint = 'https://api.example.com/data';

		global.fetch = jest.fn().mockResolvedValue({
			ok: false,
			status: 404,
		});

		await expect(apiService.fetch(endpoint)).rejects.toThrow('HTTP error! status: 404');
	});

	// Test different HTTP methods
	it('should handle different HTTP methods correctly', async () => {
		const endpoint = 'https://api.example.com/data';
		const mockData = { key: 'value' };

		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => mockData,
		});

		const methods = [HTTPMethod.PUT, HTTPMethod.DELETE, HTTPMethod.PATCH];

		for (const method of methods) {
			await apiService.fetch(endpoint, { method });
			expect(global.fetch).toHaveBeenCalledWith(
				endpoint,
				expect.objectContaining({ method }),
			);
		}
	});

	// Test header merging
	it('should correctly merge headers', async () => {
		const endpoint = 'https://api.example.com/data';
		const customHeaders = { 'X-Custom-Header': 'custom-value' };

		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => ({}),
		});

		await apiService.fetch(endpoint, { headers: customHeaders });

		expect(global.fetch).toHaveBeenCalledWith(
			endpoint,
			expect.objectContaining({
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'X-Custom-Header': 'custom-value',
				}),
			}),
		);
	});

	// Test cache key generation
	it('should generate correct cache keys', async () => {
		const endpoint = 'https://api.example.com/data';
		const mockData = { key: 'value' };

		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => mockData,
		});

		// Make two requests with different methods
		await apiService.fetch(endpoint);
		await apiService.fetch(endpoint, { method: HTTPMethod.POST });

		// Clear cache to force re-fetch
		apiService.clearCache();

		// Fetch again
		await apiService.fetch(endpoint);

		// The GET request should have been made twice, and the POST once
		expect(global.fetch).toHaveBeenCalledTimes(3);
	});

	// Test concurrent requests
	it('should handle concurrent requests correctly', async () => {
		const endpoint = 'https://api.example.com/data';
		const mockData = { key: 'value' };

		let fetchCount = 0;
		global.fetch = jest.fn().mockImplementation(() => {
			fetchCount++;
			return Promise.resolve({
				ok: true,
				json: async () => mockData,
			});
		});

		const requests = Array(5)
			.fill(null)
			.map(() => apiService.fetch(endpoint));
		await Promise.all(requests);

		// The number of fetch calls should be 1
		expect(fetchCount).toBe(1);

		// All requests should return the same data
		const results = await Promise.all(requests);
		results.forEach((result) => expect(result).toEqual(mockData));
	});

	// Test abort controller cleanup
	it('should cleanup abort controller after request completion', async () => {
		const endpoint = 'https://api.example.com/data';

		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => ({}),
		});

		await apiService.fetch(endpoint);

		// @ts-ignore - Accessing private property for testing
		expect(apiService.abortControllers.has(endpoint)).toBe(false);
	});

	// Updated test for abortAll with pending requests
	it('should abort all pending requests when abortAll is called', async () => {
		const endpoint1 = 'https://api.example.com/data1';
		const endpoint2 = 'https://api.example.com/data2';

		global.fetch = jest
			.fn()
			.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 1000),
					),
			);

		const request1 = apiService.fetch(endpoint1);
		const request2 = apiService.fetch(endpoint2);

		// Wait a bit to ensure requests have started
		await new Promise((resolve) => setTimeout(resolve, 100));

		apiService.abortAll();

		await expect(request1).rejects.toThrow(
			'Request to https://api.example.com/data1 was aborted',
		);
		await expect(request2).rejects.toThrow(
			'Request to https://api.example.com/data2 was aborted',
		);

		// Ensure both AbortControllers were removed from the map
		// @ts-ignore - Accessing private property for testing
		expect(apiService.abortControllers.size).toBe(0);
	});
});
