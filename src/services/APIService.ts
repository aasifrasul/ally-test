import type { APIOptions } from '../types/api';
import { HTTPMethod } from '../types/api';
import { createLogger, LogLevel, Logger } from '../utils/logger';
import { fetchAPIData, Result } from '../utils/common';

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
	private pendingRequests: Map<string, Promise<Result<any>>>;
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

	// ✅ Improved cache key that considers more factors
	private createCacheKey(endpoint: string, options: APIOptions): string {
		const method = options.method || HTTPMethod.GET;
		const headers = JSON.stringify(options.headers || {});
		// Only include body for cache key if it's a GET request (shouldn't have body anyway)
		const body = method === HTTPMethod.GET ? '' : JSON.stringify(options.body || '');
		return `${method}:${endpoint}:${headers}:${body}`;
	}

	private shouldCache(method?: string): boolean {
		return !method || method.toUpperCase() === HTTPMethod.GET;
	}

	async fetch<T>(endpoint: string, options: APIOptions = {}): Promise<Result<T>> {
		const cacheKey = this.createCacheKey(endpoint, options);

		// Check cache first
		if (this.shouldCache(options.method) && this.cache.has(cacheKey)) {
			this.logger.debug('Returning cached data for:', endpoint);
			return { success: true, data: this.cache.get(cacheKey) };
		}

		// Check pending requests
		if (this.pendingRequests.has(cacheKey)) {
			this.logger.debug('Returning pending request for:', endpoint);
			return this.pendingRequests.get(cacheKey)!;
		}

		// Create and store the promise, then return it
		const promise = this.executeRequest<T>(endpoint, options, cacheKey);
		this.pendingRequests.set(cacheKey, promise);
		return promise;
	}

	private async executeRequest<T>(
		endpoint: string,
		options: APIOptions,
		cacheKey: string,
	): Promise<Result<T>> {
		const abortController = new AbortController();
		this.abortControllers.set(cacheKey, abortController);

		const result = await fetchAPIData<T>(endpoint, {
			...options,
			signal: abortController.signal,
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			body: options.body as BodyInit | undefined,
		});

		// Cache successful GET results only
		if (result.success && this.shouldCache(options.method)) {
			this.cache.set(cacheKey, result.data);
			this.logger.debug('Cached result for:', endpoint);
		}

		this.abortControllers.delete(cacheKey);
		this.pendingRequests.delete(cacheKey);

		return result;
	}
	// ✅ Improved abort - can abort specific requests or all to an endpoint

	abort(endpoint: string): void {
		let aborted = 0;
		this.abortControllers.forEach((controller, key) => {
			if (key.startsWith(endpoint)) {
				controller.abort();
				this.abortControllers.delete(key);
				aborted++;
			}
		});
		if (aborted > 0) {
			this.logger.debug(`Aborted ${aborted} request(s) to:`, endpoint);
		}
	}

	clearCache(pattern?: string): void {
		if (pattern) {
			// Clear cache entries matching pattern
			for (const [key] of this.cache) {
				if (key.includes(pattern)) {
					this.cache.delete(key);
				}
			}
			this.logger.debug('Cache cleared for pattern:', pattern);
		} else {
			this.cache.clear();
			this.logger.debug('Cache cleared');
		}
	}

	abortAll(): void {
		const count = this.abortControllers.size;
		this.abortControllers.forEach((controller) => {
			controller.abort();
		});
		this.abortControllers.clear();
		this.logger.debug(`Aborted ${count} request(s)`);
	}

	// ✅ Additional utility methods
	getCacheSize(): number {
		return this.cache.size;
	}

	getPendingRequestsCount(): number {
		return this.pendingRequests.size;
	}

	getActiveRequestsCount(): number {
		return this.abortControllers.size;
	}
}
