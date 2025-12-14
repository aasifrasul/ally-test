import { HTTPMethod } from '../types/api';
import { createLogger, LogLevel, Logger } from '../utils/Logger';
import { fetchAPIData, Result } from '../utils/common';
import { isString } from '../utils/typeChecking';

export interface SaveDataOptions extends RequestInit {
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
	private cacheTTL: Map<string, number> = new Map();

	private setCache(key: string, value: any, ttlMs = 60_000): void {
		this.cache.set(key, value);
		this.cacheTTL.set(key, Date.now() + ttlMs);
	}

	private getCache(key: string): any | undefined {
		const expiresAt = this.cacheTTL.get(key);
		if (expiresAt && Date.now() > expiresAt) {
			this.cache.delete(key);
			this.cacheTTL.delete(key);
			return undefined;
		}
		return this.cache.get(key);
	}

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

	private createCacheKey(endpoint: string, options: RequestInit): string {
		const method = options.method || HTTPMethod.GET;
		const headers = JSON.stringify(options.headers || {});
		// Only include body for cache key if it's a GET request (shouldn't have body anyway)
		let body = '';
		if (method !== HTTPMethod.GET && options.body) {
			try {
				body = isString(options.body) ? options.body : JSON.stringify(options.body);
			} catch {
				body = '[unserializable-body]';
			}
		}

		return `${method}:${endpoint}:${headers}:${body}`;
	}

	private shouldCache(method?: string): boolean {
		return !method || method.toUpperCase() === HTTPMethod.GET;
	}

	async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<Result<T>> {
		const cacheKey = this.createCacheKey(endpoint, options);

		// Check cache first
		const cached = this.getCache(cacheKey);
		if (this.shouldCache(options.method) && cached !== undefined) {
			return { success: true, data: cached };
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
		options: RequestInit,
		cacheKey: string,
	): Promise<Result<T>> {
		const abortController = new AbortController();
		this.abortControllers.set(cacheKey, abortController);

		const result = await fetchAPIData<T>(endpoint, {
			...options,
			signal: abortController.signal,
			body: options.body as BodyInit | undefined,
		});

		// Cache successful GET results only
		if (result.success && this.shouldCache(options.method)) {
			this.setCache(cacheKey, result.data);
			this.logger.debug('Cached result for:', endpoint);
		}

		this.abortControllers.delete(cacheKey);
		this.pendingRequests.delete(cacheKey);

		return result;
	}

	async save<T extends SaveDataResponse>(
		endpoint: string,
		options: SaveDataOptions,
	): Promise<Result<T>> {
		return this.fetch<T>(endpoint, { ...options, method: HTTPMethod.POST });
	}

	abort(endpoint: string): void {
		let aborted = 0;
		this.abortControllers.forEach((controller, key) => {
			if (key.includes(`:${endpoint}:`)) {
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
