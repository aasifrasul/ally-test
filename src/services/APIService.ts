import type { APIOptions } from '../types/api';
import { HTTPMethod } from '../types/api';
import { createLogger, LogLevel, Logger } from '../utils/logger';
import { fetch, BodyInit } from '../utils/fetch-polyfill';

export interface SaveDataOptions extends APIOptions {
	body: BodyInit;
	signal?: AbortSignal;
}

export interface SaveDataResponse {
	success: boolean;
}

export class APIService {
	private static instance: APIService;
	private abortControllers: Map<string, AbortController>;
	private cache: Map<string, any>;
	private pendingRequests: Map<string, Promise<any>>;
	private logger: Logger;

	private constructor() {
		this.abortControllers = new Map();
		this.cache = new Map();
		this.pendingRequests = new Map();
		this.logger = createLogger('APIService', {
			level: LogLevel.DEBUG,
		});
	}

	public static getInstance(): APIService {
		if (!APIService.instance) {
			APIService.instance = new APIService();
		}
		return APIService.instance;
	}

	private createCacheKey(endpoint: string, options: APIOptions): string {
		const methodKey = options.method || HTTPMethod.GET;
		return `${methodKey}:${endpoint}`;
	}

	private shouldCache(method?: string): boolean {
		return !method || method.toUpperCase() === HTTPMethod.GET;
	}

	async fetch<T>(endpoint: string, options: APIOptions = {}): Promise<T> {
		const cacheKey = this.createCacheKey(endpoint, options);

		if (this.shouldCache(options.method) && this.cache.has(cacheKey)) {
			this.logger.debug('Returning cached data for:', endpoint);
			return this.cache.get(cacheKey);
		}

		if (this.pendingRequests.has(cacheKey)) {
			this.logger.debug('Returning pending request for:', endpoint);
			return this.pendingRequests.get(cacheKey);
		}

		const abortController = new AbortController();
		this.abortControllers.set(endpoint, abortController);

		const fetchPromise = (async () => {
			try {
				const response = await fetch(endpoint, {
					...options,
					signal: abortController.signal,
					headers: {
						'Content-Type': 'application/json',
						...options.headers,
					},
					body: options.body as BodyInit | undefined,
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				if (this.shouldCache(options.method)) {
					this.cache.set(cacheKey, data);
				}

				return data;
			} finally {
				this.abortControllers.delete(endpoint);
				this.pendingRequests.delete(cacheKey);
			}
		})();

		this.pendingRequests.set(cacheKey, fetchPromise);

		return fetchPromise;
	}

	async saveData(endpoint: string, data: Record<string, any>): Promise<SaveDataResponse> {
		return this.fetch<SaveDataResponse>(endpoint, {
			method: HTTPMethod.POST,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
	}

	abort(endpoint: string): void {
		const controller = this.abortControllers.get(endpoint);
		if (controller) {
			controller.abort();
			this.abortControllers.delete(endpoint);
			this.logger.debug('Aborted request to:', endpoint);
		}
	}

	clearCache(): void {
		this.cache.clear();
		this.logger.debug('Cache cleared');
	}

	abortAll(): void {
		this.abortControllers.forEach((controller, endpoint) => {
			controller.abort();
			this.logger.debug('Aborted request to:', endpoint);
		});
		this.abortControllers.clear();
	}
}
