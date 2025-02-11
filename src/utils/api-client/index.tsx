import { ApiError } from './types';

export class ApiClient {
	constructor() {}

	async request<T>(url: string, options: RequestInit = {}): Promise<T> {
		const headers = {
			'Content-Type': 'application/json',
			...options.headers,
		};

		try {
			const response = await fetch(url, { ...options, headers });

			if (!response.ok) {
				const error = new Error('API Error') as ApiError;
				error.status = response.status;
				error.data = await response.json().catch(() => null);
				throw error;
			}

			return await response.json();
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('Network error');
		}
	}
}
