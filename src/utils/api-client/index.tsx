import { ApiError } from './types';

export class ApiClient<T extends string> {
	private baseUrl: string;

	constructor(baseUrl: string = '') {
		this.baseUrl = baseUrl;
	}

	async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | undefined> {
		const controller = new AbortController();
		const signal = controller.signal;
		const url = `${this.baseUrl}${endpoint}`;
		const headers = {
			'Content-Type': 'application/json',
			...options.headers,
		};

		try {
			const response = await fetch(url, { ...options, headers, signal });

			if (!response.ok) {
				const error = new Error(
					`API Error: ${response.status} ${response.statusText}`,
				) as ApiError;
				error.status = response.status;
				try {
					// Attempt to parse JSON error response
					error.data = await response.json();
				} catch (jsonError) {
					console.error('Failed to parse JSON error response', jsonError);
					error.data = await response.text(); // Fallback to text if JSON parse fails
				}
				throw error;
			}

			return await response.json();
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				console.log('Fetch aborted');
				return; // Or throw a specific cancellation error
			}
			// ... other error handling
		}
	}
}
