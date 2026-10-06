import { createLogger, LogLevel, Logger } from '../utils/Logger';

export interface ImageManagerOptions {
	placeholder?: string;
	enableLogging?: boolean;
	timeout?: number;
	maxRetries?: number;
	retryDelay?: number;
	useCache?: boolean;
}

export interface LoadImageOptions {
	targetElement?: HTMLImageElement;
	placeholder?: string;
	/** Override fetch mode for this specific load. Defaults to false (simple mode). */
	useFetch?: boolean;
	onLoad?: (img: HTMLImageElement) => void;
	onError?: (error: Error) => void;
	onCancel?: () => void;
}

interface CachedImage {
	objectUrl: string;
	refCount: number;
	timestamp: number;
}

export class ImageManager {
	private static instance: ImageManager;
	private logger: Logger;
	private options: Required<ImageManagerOptions>;
	private cache: Map<string, CachedImage> = new Map();
	private pendingLoads: Map<string, Promise<string>> = new Map();

	private constructor(options: ImageManagerOptions = {}) {
		this.options = {
			placeholder:
				options.placeholder ||
				'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNGY0ZjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU1ZTUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==',
			enableLogging: options.enableLogging ?? true,
			timeout: options.timeout ?? 30000,
			maxRetries: options.maxRetries ?? 3,
			retryDelay: options.retryDelay ?? 1000,
			useCache: options.useCache ?? true,
		};

		this.logger = createLogger('ImageManager', { level: LogLevel.DEBUG });
	}

	/**
	 * Gets or creates the singleton ImageManager instance.
	 * Options are only applied on the first call; subsequent calls return the
	 * existing instance regardless of the options passed.
	 */
	public static getInstance(options?: ImageManagerOptions): ImageManager {
		if (!ImageManager.instance) {
			ImageManager.instance = new ImageManager(options);
		}
		return ImageManager.instance;
	}

	/**
	 * Loads an image, updating an optional target element with a placeholder
	 * while loading. Use `useFetch: true` for retry logic and object-URL caching;
	 * omit it (or pass `false`) for a fast direct-src load.
	 */
	public async load(url: string, options: LoadImageOptions = {}): Promise<string> {
		const {
			targetElement,
			placeholder = this.options.placeholder,
			useFetch = false,
			onLoad,
			onError,
			onCancel,
		} = options;

		if (targetElement && !(targetElement instanceof HTMLImageElement)) {
			const error = new Error('targetElement must be an HTMLImageElement');
			this.logger.warn('❌ Invalid targetElement');
			onError?.(error);
			throw error;
		}

		if (targetElement) {
			targetElement.src = placeholder;
			targetElement.classList.add('loading');
		}

		try {
			const finalUrl = useFetch
				? await this.loadWithFetch(url)
				: await this.loadSimple(url);

			if (targetElement) {
				targetElement.src = finalUrl;
				targetElement.classList.remove('loading');
			}

			if (this.options.enableLogging) {
				this.logger.info(`✅ Successfully loaded: ${url}`);
			}

			const img = targetElement ?? new Image();
			if (!targetElement) img.src = finalUrl;
			onLoad?.(img);

			return finalUrl;
		} catch (error) {
			if (targetElement) {
				targetElement.src = placeholder;
				targetElement.classList.remove('loading');
			}

			const err = error as Error;

			if (err.message.includes('cancelled')) {
				this.logger.warn(`🚫 Load cancelled: ${url}`);
				onCancel?.();
			} else {
				this.logger.error(`❌ Failed to load: ${url}`, error);
				onError?.(err);
			}

			throw error;
		}
	}

	/**
	 * Loads multiple images in parallel. Each result includes the original URL,
	 * the resolved URL (or null on failure), and any error.
	 */
	public async loadMultiple(
		urls: string[],
		options?: LoadImageOptions,
	): Promise<Array<{ url: string; result: string | null; error: Error | null }>> {
		return Promise.all(
			urls.map(async (url) => {
				try {
					return { url, result: await this.load(url, options), error: null };
				} catch (error) {
					return { url, result: null, error: error as Error };
				}
			}),
		);
	}

	/**
	 * Decrements the reference count for a cached object URL.
	 * When the count reaches zero the object URL is revoked and the entry removed.
	 * Only relevant when images were loaded with `useFetch: true`.
	 *
	 * @param originalUrl - The original image URL (not the object URL).
	 */
	public revoke(originalUrl: string): void {
		const cached = this.cache.get(originalUrl);
		if (!cached) {
			this.logger.debug(`⚠️ Attempted to revoke non-cached URL: ${originalUrl}`);
			return;
		}

		cached.refCount--;

		if (cached.refCount <= 0) {
			try {
				URL.revokeObjectURL(cached.objectUrl);
				this.cache.delete(originalUrl);
				this.logger.debug(`🗑️ Revoked and removed from cache: ${originalUrl}`);
			} catch (error) {
				this.logger.error(`❌ Failed to revoke: ${originalUrl}`, error);
			}
		} else {
			this.logger.debug(`🔽 Decremented refCount to ${cached.refCount}: ${originalUrl}`);
		}
	}

	/** Revokes all cached object URLs and clears internal state. */
	public clearCache(): void {
		this.logger.info(`🧹 Clearing cache (${this.cache.size} images)`);

		for (const [url, cached] of this.cache.entries()) {
			try {
				URL.revokeObjectURL(cached.objectUrl);
			} catch (error) {
				this.logger.error(`❌ Failed to revoke: ${url}`, error);
			}
		}

		this.cache.clear();
		this.pendingLoads.clear();
	}

	public getCacheSize(): number {
		return this.cache.size;
	}

	public isCached(url: string): boolean {
		return this.cache.has(url);
	}

	public isLoading(url: string): boolean {
		return this.pendingLoads.has(url);
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	/** Direct img.src load — no caching, no retry. Deduplicates in-flight requests. */
	private loadSimple(url: string): Promise<string> {
		const pending = this.pendingLoads.get(url);
		if (pending) return pending;

		const promise = new Promise<string>((resolve, reject) => {
			const img = new Image();
			img.addEventListener(
				'load',
				() => {
					this.pendingLoads.delete(url);
					resolve(url);
				},
				{ once: true },
			);
			img.addEventListener(
				'error',
				() => {
					this.pendingLoads.delete(url);
					reject(new Error(`Failed to load image: ${url}`));
				},
				{ once: true },
			);
			img.src = url;
		});

		this.pendingLoads.set(url, promise);
		return promise;
	}

	/** Fetch-based load with retry, timeout, and object-URL caching. */
	private async loadWithFetch(url: string): Promise<string> {
		if (this.options.useCache) {
			const cached = this.cache.get(url);
			if (cached) {
				cached.refCount++;
				this.logger.debug(`📦 Cache hit (refCount: ${cached.refCount}): ${url}`);
				return cached.objectUrl;
			}
		}

		const pending = this.pendingLoads.get(url);
		if (pending) {
			this.logger.debug(`⏳ Waiting for pending load: ${url}`);
			return pending;
		}

		const loadPromise = this.fetchWithRetry(url);
		this.pendingLoads.set(url, loadPromise);

		try {
			const objectUrl = await loadPromise;

			if (this.options.useCache) {
				this.cache.set(url, { objectUrl, refCount: 1, timestamp: Date.now() });
			}

			this.pendingLoads.delete(url);
			return objectUrl;
		} catch (error) {
			this.pendingLoads.delete(url);
			throw error;
		}
	}

	private async fetchWithRetry(url: string): Promise<string> {
		const { timeout, maxRetries, retryDelay } = this.options;
		let lastError: Error | undefined;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			try {
				const response = await fetch(url, { signal: controller.signal });
				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const blob = await response.blob();

				if (!blob.type.startsWith('image/')) {
					throw new Error(`Not an image. Content-Type: ${blob.type}`);
				}

				return URL.createObjectURL(blob);
			} catch (error) {
				clearTimeout(timeoutId);
				lastError = error as Error;

				if (attempt < maxRetries - 1) {
					this.logger.debug(`🔄 Retry ${attempt + 2}/${maxRetries}: ${url}`);
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
				}
			}
		}

		throw lastError ?? new Error(`Failed after ${maxRetries} attempts: ${url}`);
	}
}
