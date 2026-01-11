import { createLogger, LogLevel, Logger } from '../utils/Logger';

/**
 * @interface ImageManagerOptions
 * @description Configuration options for ImageManager.
 */
export interface ImageManagerOptions {
	/**
	 * @property {string} [placeholder] - Default placeholder image URL.
	 */
	placeholder?: string;
	/**
	 * @property {boolean} [enableLogging] - Enable logging. Defaults to true.
	 */
	enableLogging?: boolean;
	/**
	 * @property {number} [timeout] - Timeout for image loads in ms. Defaults to 30000.
	 */
	timeout?: number;
	/**
	 * @property {number} [maxRetries] - Maximum retry attempts. Defaults to 3.
	 */
	maxRetries?: number;
	/**
	 * @property {number} [retryDelay] - Delay between retries in ms. Defaults to 1000.
	 */
	retryDelay?: number;
	/**
	 * @property {boolean} [useCache] - Enable caching. Defaults to true.
	 */
	useCache?: boolean;
	/**
	 * @property {boolean} [useFetch] - Use fetch API with retry logic. Defaults to false.
	 */
	useFetch?: boolean;
}

/**
 * @interface LoadImageOptions
 * @description Options for loading a specific image.
 */
export interface LoadImageOptions {
	/**
	 * @property {HTMLImageElement} [targetElement] - Target img element to update.
	 */
	targetElement?: HTMLImageElement;
	/**
	 * @property {string} [placeholder] - Placeholder for this specific load.
	 */
	placeholder?: string;
	/**
	 * @property {boolean} [useFetch] - Override default fetch behavior for this load.
	 */
	useFetch?: boolean;
	/**
	 * @property {((img: HTMLImageElement) => void)} [onLoad] - Success callback.
	 */
	onLoad?: (img: HTMLImageElement) => void;
	/**
	 * @property {((error: Error) => void)} [onError] - Error callback.
	 */
	onError?: (error: Error) => void;
	/**
	 * @property {(() => void)} [onCancel] - Cancellation callback.
	 */
	onCancel?: () => void;
}

/**
 * @interface CachedImage
 * @description Cached image data with metadata.
 */
interface CachedImage {
	objectUrl: string;
	refCount: number;
	timestamp: number;
}

/**
 * @interface ActiveRequest
 * @description Tracks an active image loading request.
 */
interface ActiveRequest {
	url: string;
	targetElement?: HTMLImageElement;
	cancelled: boolean;
	promise: Promise<string>;
}

/**
 * @class ImageManager
 * @description Unified image loading manager that combines simple DOM manipulation
 * with advanced features like caching, retry logic, and request deduplication.
 * Can work in two modes:
 * - Simple mode: Direct img.src assignment (fast, no caching)
 * - Fetch mode: Fetch API with retry, timeout, and caching (robust, cacheable)
 */
export class ImageManager {
	private static instance: ImageManager;
	private logger: Logger;
	private options: Required<ImageManagerOptions>;
	private cache: Map<string, CachedImage> = new Map();
	private pendingLoads: Map<string, Promise<string>> = new Map();
	private activeRequests: Map<string, ActiveRequest> = new Map();

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
			useFetch: options.useFetch ?? false,
		};

		this.logger = createLogger('ImageManager', {
			level: LogLevel.DEBUG,
		});
	}

	/**
	 * @method getInstance
	 * @description Gets or creates the singleton ImageManager instance.
	 * @param {ImageManagerOptions} [options] - Options (only used on first call).
	 * @returns {ImageManager} The ImageManager instance.
	 */
	public static getInstance(options?: ImageManagerOptions): ImageManager {
		if (!ImageManager.instance) {
			ImageManager.instance = new ImageManager(options);
		}
		return ImageManager.instance;
	}

	/**
	 * @method load
	 * @description Loads an image with automatic mode selection and DOM updates.
	 * @param {string} url - The image URL to load.
	 * @param {LoadImageOptions} [options={}] - Loading options.
	 * @returns {Promise<string>} Promise resolving to the image URL (or object URL if using fetch).
	 */
	public async load(url: string, options: LoadImageOptions = {}): Promise<string> {
		const {
			targetElement,
			placeholder = this.options.placeholder,
			useFetch = this.options.useFetch,
			onLoad,
			onError,
			onCancel,
		} = options;

		// Validate target element
		if (targetElement && !(targetElement instanceof HTMLImageElement)) {
			const error = new Error('targetElement must be an HTMLImageElement');
			this.logger.warn('❌ Invalid targetElement');
			onError?.(error);
			throw error;
		}

		// Set placeholder immediately if we have a target element
		if (targetElement) {
			targetElement.src = placeholder;
			targetElement.classList.add('loading');
		}

		try {
			let finalUrl: string;

			if (useFetch) {
				// Use fetch mode with caching and retry
				finalUrl = await this.loadWithFetch(url);
			} else {
				// Use simple mode with direct img loading
				finalUrl = await this.loadSimple(url);
			}

			// Update target element on success
			if (targetElement) {
				targetElement.src = finalUrl;
				targetElement.classList.remove('loading');
			}

			if (this.options.enableLogging) {
				this.logger.info(`✅ Successfully loaded: ${url}`);
			}

			// Create an img element for the callback
			const img = targetElement || new Image();
			if (!targetElement) {
				img.src = finalUrl;
			}
			onLoad?.(img);

			return finalUrl;
		} catch (error) {
			// Revert to placeholder on error
			if (targetElement) {
				targetElement.src = placeholder;
				targetElement.classList.remove('loading');
			}

			const err = error as Error;

			if (err.message.includes('cancelled')) {
				if (this.options.enableLogging) {
					this.logger.warn(`🚫 Load cancelled: ${url}`);
				}
				onCancel?.();
			} else {
				if (this.options.enableLogging) {
					this.logger.error(`❌ Failed to load: ${url}`, error);
				}
				onError?.(err);
			}

			throw error;
		}
	}

	/**
	 * @method loadSimple
	 * @description Loads an image using simple img.src assignment (no caching, no retry).
	 * @private
	 * @param {string} url - The image URL.
	 * @returns {Promise<string>} Promise resolving to the original URL.
	 */
	private loadSimple(url: string): Promise<string> {
		// Check if already loading this URL
		const pending = this.pendingLoads.get(url);
		if (pending) {
			return pending;
		}

		const promise = new Promise<string>((resolve, reject) => {
			const img = new Image();

			const handleLoad = () => {
				this.pendingLoads.delete(url);
				resolve(url);
			};

			const handleError = () => {
				this.pendingLoads.delete(url);
				reject(new Error(`Failed to load image: ${url}`));
			};

			img.addEventListener('load', handleLoad, { once: true });
			img.addEventListener('error', handleError, { once: true });
			img.src = url;
		});

		this.pendingLoads.set(url, promise);
		return promise;
	}

	/**
	 * @method loadWithFetch
	 * @description Loads an image using fetch API with retry logic and caching.
	 * @private
	 * @param {string} url - The image URL.
	 * @returns {Promise<string>} Promise resolving to an object URL.
	 */
	private async loadWithFetch(url: string): Promise<string> {
		// Check cache first
		if (this.options.useCache) {
			const cached = this.cache.get(url);
			if (cached) {
				cached.refCount++;
				if (this.options.enableLogging) {
					this.logger.debug(
						`📦 Using cached image (refCount: ${cached.refCount}): ${url}`,
					);
				}
				return cached.objectUrl;
			}
		}

		// Check if already loading
		const pending = this.pendingLoads.get(url);
		if (pending) {
			if (this.options.enableLogging) {
				this.logger.debug(`⏳ Waiting for pending load: ${url}`);
			}
			return pending;
		}

		// Start new load with retry
		const loadPromise = this.fetchWithRetry(url);
		this.pendingLoads.set(url, loadPromise);

		try {
			const objectUrl = await loadPromise;

			// Cache the result
			if (this.options.useCache) {
				this.cache.set(url, {
					objectUrl,
					refCount: 1,
					timestamp: Date.now(),
				});
			}

			this.pendingLoads.delete(url);
			return objectUrl;
		} catch (error) {
			this.pendingLoads.delete(url);
			throw error;
		}
	}

	/**
	 * @method fetchWithRetry
	 * @description Fetches an image with retry logic and timeout handling.
	 * @private
	 * @param {string} url - The image URL.
	 * @returns {Promise<string>} Promise resolving to an object URL.
	 */
	private async fetchWithRetry(url: string): Promise<string> {
		const { timeout, maxRetries, retryDelay } = this.options;
		let lastError: Error | undefined;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			try {
				const response = await fetch(url, { signal: controller.signal });

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const blob = await response.blob();

				if (!blob.type.startsWith('image/')) {
					throw new Error(`Not an image. Content-Type: ${blob.type}`);
				}

				clearTimeout(timeoutId);
				const objectUrl = URL.createObjectURL(blob);
				return objectUrl;
			} catch (error) {
				clearTimeout(timeoutId);
				lastError = error as Error;

				if (attempt < maxRetries - 1) {
					if (this.options.enableLogging) {
						this.logger.debug(`🔄 Retry ${attempt + 2}/${maxRetries}: ${url}`);
					}
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
				}
			}
		}

		throw lastError || new Error(`Failed after ${maxRetries} attempts: ${url}`);
	}

	/**
	 * @method loadMultiple
	 * @description Loads multiple images in parallel.
	 * @param {string[]} urls - Array of image URLs.
	 * @param {LoadImageOptions} [options] - Options applied to all loads.
	 * @returns {Promise<Array<{url: string, result: string | null, error: Error | null}>>}
	 */
	public async loadMultiple(
		urls: string[],
		options?: LoadImageOptions,
	): Promise<Array<{ url: string; result: string | null; error: Error | null }>> {
		const promises = urls.map(async (url) => {
			try {
				const result = await this.load(url, options);
				return { url, result, error: null };
			} catch (error) {
				return { url, result: null, error: error as Error };
			}
		});

		return Promise.all(promises);
	}

	/**
	 * @method revoke
	 * @description Revokes an object URL and decrements reference count.
	 * Only call this if you used fetch mode and are done with the image.
	 * @param {string} url - The original URL (not object URL).
	 */
	public revoke(url: string): void {
		const cached = this.cache.get(url);
		if (!cached) {
			if (this.options.enableLogging) {
				this.logger.debug(`⚠️ Attempted to revoke non-cached URL: ${url}`);
			}
			return;
		}

		cached.refCount--;

		if (cached.refCount <= 0) {
			try {
				URL.revokeObjectURL(cached.objectUrl);
				this.cache.delete(url);
				if (this.options.enableLogging) {
					this.logger.debug(`🗑️ Revoked and removed from cache: ${url}`);
				}
			} catch (error) {
				this.logger.error(`❌ Failed to revoke: ${url}`, error);
			}
		} else if (this.options.enableLogging) {
			this.logger.debug(`🔽 Decremented refCount to ${cached.refCount}: ${url}`);
		}
	}

	/**
	 * @method clearCache
	 * @description Clears all cached images and revokes object URLs.
	 */
	public clearCache(): void {
		if (this.options.enableLogging) {
			this.logger.info(`🧹 Clearing cache (${this.cache.size} images)`);
		}

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

	/**
	 * @method getCacheSize
	 * @description Gets the number of cached images.
	 * @returns {number} Cache size.
	 */
	public getCacheSize(): number {
		return this.cache.size;
	}

	/**
	 * @method isCached
	 * @description Checks if a URL is cached.
	 * @param {string} url - The URL to check.
	 * @returns {boolean} True if cached.
	 */
	public isCached(url: string): boolean {
		return this.cache.has(url);
	}

	/**
	 * @method isLoading
	 * @description Checks if a URL is currently being loaded.
	 * @param {string} url - The URL to check.
	 * @returns {boolean} True if loading.
	 */
	public isLoading(url: string): boolean {
		return this.pendingLoads.has(url);
	}
}
