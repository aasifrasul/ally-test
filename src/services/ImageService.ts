import { createLogger, LogLevel, Logger } from '../utils/Logger';

/**
 * @interface ImageLoadOptions
 * @description Configuration options for loading images.
 */
interface ImageLoadOptions {
	/**
	 * @property {number} [timeout] - Maximum time in milliseconds to wait for image load. Defaults to 30000ms.
	 */
	timeout?: number;
	/**
	 * @property {number} [maxRetries] - Maximum number of retry attempts. Defaults to 3.
	 */
	maxRetries?: number;
	/**
	 * @property {number} [retryDelay] - Delay in milliseconds between retry attempts. Defaults to 1000ms.
	 */
	retryDelay?: number;
}

/**
 * @interface ImageLoadResult
 * @description Result object for image loading operations.
 */
interface ImageLoadResult {
	/**
	 * @property {string} url - The original URL that was requested.
	 */
	url: string;
	/**
	 * @property {string | null} objectUrl - The object URL if successful, null if failed.
	 */
	objectUrl: string | null;
	/**
	 * @property {boolean} success - Whether the load was successful.
	 */
	success: boolean;
	/**
	 * @property {Error | null} error - The error if the load failed, null if successful.
	 */
	error: Error | null;
}

/**
 * @interface CachedImage
 * @description Cached image data with reference counting.
 */
interface CachedImage {
	objectUrl: string;
	refCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 30000;

/**
 * @class ImageService
 * @description A singleton service for loading images with retry logic, timeout handling,
 * caching, and automatic memory management. Uses fetch API to load images as blobs
 * and converts them to object URLs.
 */
export class ImageService {
	private static instance: ImageService;
	private logger: Logger;
	private defaultOptions: ImageLoadOptions = {
		timeout: TIMEOUT,
		maxRetries: MAX_RETRIES,
		retryDelay: RETRY_DELAY,
	};
	/**
	 * @private
	 * @property {Map<string, CachedImage>} cache - Cache of loaded images with reference counting.
	 */
	private cache: Map<string, CachedImage> = new Map();
	/**
	 * @private
	 * @property {Map<string, Promise<string>>} pendingLoads - Tracks in-flight requests to prevent duplicate loads.
	 */
	private pendingLoads: Map<string, Promise<string>> = new Map();

	private constructor() {
		this.logger = createLogger('ImageService', {
			level: LogLevel.DEBUG,
		});
	}

	/**
	 * @method getInstance
	 * @description Gets the singleton instance of ImageService.
	 * @returns {ImageService} The ImageService instance.
	 */
	public static getInstance(): ImageService {
		if (!ImageService.instance) {
			ImageService.instance = new ImageService();
		}
		return ImageService.instance;
	}

	/**
	 * @method loadWithRetry
	 * @description Internal method that loads an image with retry logic and timeout handling.
	 * @private
	 * @param {string} url - The URL of the image to load.
	 * @param {ImageLoadOptions} [options={}] - Options for loading the image.
	 * @returns {Promise<string>} A promise that resolves to an object URL.
	 */
	private async loadWithRetry(url: string, options: ImageLoadOptions = {}): Promise<string> {
		const {
			timeout = TIMEOUT,
			maxRetries = MAX_RETRIES,
			retryDelay = RETRY_DELAY,
		} = { ...this.defaultOptions, ...options };
		let lastError: Error | undefined;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			try {
				const response = await fetch(url, { signal: controller.signal });

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const blob = await response.blob();

				// Validate that it's actually an image
				if (!blob.type.startsWith('image/')) {
					throw new Error(`Response is not an image. Content-Type: ${blob.type}`);
				}

				clearTimeout(timeoutId);
				const objectUrl = URL.createObjectURL(blob);
				this.logger.debug(`✅ Successfully loaded image: ${url}`);
				return objectUrl;
			} catch (error) {
				clearTimeout(timeoutId);
				lastError = error as Error;

				// Don't retry on abort (timeout) if it's the last attempt
				if (error instanceof Error && error.name === 'AbortError') {
					this.logger.warn(`⏱️ Image load timed out (${timeout}ms): ${url}`);
				}

				if (attempt < maxRetries - 1) {
					this.logger.debug(
						`🔄 Retrying image load (attempt ${attempt + 2}/${maxRetries}): ${url}`,
					);
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
				}
			}
		}

		const errorMessage = `Failed to load image after ${maxRetries} attempts: ${url}`;
		this.logger.error(`❌ ${errorMessage}`, lastError);
		throw lastError || new Error(errorMessage);
	}

	/**
	 * @method load
	 * @description Loads an image from a URL. Uses caching to avoid duplicate loads and
	 * reference counting for proper memory management.
	 * @param {string} url - The URL of the image to load.
	 * @param {ImageLoadOptions} [options] - Options for loading the image.
	 * @returns {Promise<string>} A promise that resolves to an object URL.
	 */
	async load(url: string, options?: ImageLoadOptions): Promise<string> {
		// Check cache first
		const cached = this.cache.get(url);
		if (cached) {
			cached.refCount++;
			this.logger.debug(`📦 Using cached image (refCount: ${cached.refCount}): ${url}`);
			return cached.objectUrl;
		}

		// Check if already loading
		const pending = this.pendingLoads.get(url);
		if (pending) {
			this.logger.debug(`⏳ Waiting for pending load: ${url}`);
			return pending;
		}

		// Start new load
		const loadPromise = this.loadWithRetry(url, options)
			.then((objectUrl) => {
				// Cache the result
				this.cache.set(url, {
					objectUrl,
					refCount: 1,
				});
				// Remove from pending
				this.pendingLoads.delete(url);
				return objectUrl;
			})
			.catch((error) => {
				// Remove from pending on error
				this.pendingLoads.delete(url);
				throw error;
			});

		this.pendingLoads.set(url, loadPromise);
		return loadPromise;
	}

	/**
	 * @method loadMultiple
	 * @description Loads multiple images in parallel and returns detailed results for each.
	 * @param {string[]} urls - Array of image URLs to load.
	 * @param {ImageLoadOptions} [options] - Options for loading the images.
	 * @returns {Promise<ImageLoadResult[]>} A promise that resolves to an array of load results.
	 */
	async loadMultiple(
		urls: string[],
		options?: ImageLoadOptions,
	): Promise<ImageLoadResult[]> {
		const promises = urls.map(async (url): Promise<ImageLoadResult> => {
			try {
				const objectUrl = await this.load(url, options);
				return {
					url,
					objectUrl,
					success: true,
					error: null,
				};
			} catch (error) {
				this.logger.error(`❌ Failed to load image ${url}:`, error);
				return {
					url,
					objectUrl: null,
					success: false,
					error: error as Error,
				};
			}
		});

		return Promise.all(promises);
	}

	/**
	 * @method revokeObjectURL
	 * @description Revokes an object URL and decrements its reference count.
	 * Only actually revokes the URL when reference count reaches zero.
	 * @param {string} url - The original URL (not the object URL) to revoke.
	 */
	revokeObjectURL(url: string): void {
		const cached = this.cache.get(url);
		if (!cached) {
			this.logger.warn(`⚠️ Attempted to revoke non-cached URL: ${url}`);
			return;
		}

		cached.refCount--;
		this.logger.debug(`🔽 Decremented refCount to ${cached.refCount} for: ${url}`);

		if (cached.refCount <= 0) {
			try {
				URL.revokeObjectURL(cached.objectUrl);
				this.cache.delete(url);
				this.logger.debug(`🗑️ Revoked and removed from cache: ${url}`);
			} catch (error) {
				this.logger.error(`❌ Failed to revoke object URL for ${url}:`, error);
			}
		}
	}

	/**
	 * @method revokeMultipleObjectURLs
	 * @description Revokes multiple object URLs.
	 * @param {string[]} urls - Array of original URLs to revoke.
	 */
	revokeMultipleObjectURLs(urls: string[]): void {
		urls.forEach((url) => this.revokeObjectURL(url));
	}

	/**
	 * @method clearCache
	 * @description Clears the entire cache and revokes all object URLs.
	 * Warning: This will revoke URLs that may still be in use.
	 */
	clearCache(): void {
		this.logger.info(`🧹 Clearing cache of ${this.cache.size} images`);
		for (const [url, cached] of this.cache.entries()) {
			try {
				URL.revokeObjectURL(cached.objectUrl);
			} catch (error) {
				this.logger.error(`❌ Failed to revoke object URL for ${url}:`, error);
			}
		}
		this.cache.clear();
		this.pendingLoads.clear();
	}

	/**
	 * @method getCacheSize
	 * @description Gets the current number of cached images.
	 * @returns {number} The number of images in the cache.
	 */
	getCacheSize(): number {
		return this.cache.size;
	}

	/**
	 * @method isLoading
	 * @description Checks if a specific URL is currently being loaded.
	 * @param {string} url - The URL to check.
	 * @returns {boolean} True if the URL is currently being loaded.
	 */
	isLoading(url: string): boolean {
		return this.pendingLoads.has(url);
	}

	/**
	 * @method isCached
	 * @description Checks if a specific URL is in the cache.
	 * @param {string} url - The URL to check.
	 * @returns {boolean} True if the URL is cached.
	 */
	isCached(url: string): boolean {
		return this.cache.has(url);
	}
}
