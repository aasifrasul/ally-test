import { createLogger, LogLevel, Logger } from './Logger';

/**
 * @interface ImageLoaderOptions
 * @description Defines the options for the ImageLoader constructor.
 */
export interface ImageLoaderOptions {
	/**
	 * @property {string} [placeholder] - The default placeholder image URL. Defaults to a base64 SVG gradient.
	 */
	placeholder?: string;
	/**
	 * @property {boolean} [enableLogging] - Whether to enable logging for image loading operations. Defaults to true.
	 */
	enableLogging?: boolean;
}

/**
 * @interface LoadImageCallbacks
 * @description Defines callback functions for the loadImage method.
 */
export interface LoadImageCallbacks {
	/**
	 * @property {((img: HTMLImageElement) => void)} [onLoad] - Callback function triggered on successful image load.
	 */
	onLoad?: (img: HTMLImageElement) => void;
	/**
	 * @property {((error: Error) => void)} [onError] - Callback function triggered if an error occurs during image loading.
	 */
	onError?: (error: Error) => void;
	/**
	 * @property {(() => void)} [onCancel] - Callback function triggered if the image load is cancelled.
	 */
	onCancel?: () => void;
}

/**
 * @interface LoadImagePromiseOptions
 * @description Defines options specific to the loadImagePromise method.
 */
export interface LoadImagePromiseOptions {
	/**
	 * @property {HTMLImageElement} [targetElement] - The HTMLImageElement to display the image in.
	 */
	targetElement?: HTMLImageElement;
	/**
	 * @property {string} [placeholder] - A specific placeholder image URL for this load operation, overriding the default.
	 */
	placeholder?: string;
}

/**
 * @interface CurrentImageRequest
 * @description Represents an ongoing image loading request.
 */
interface CurrentImageRequest {
	img: HTMLImageElement;
	url: string;
	cancelled: boolean;
}

/**
 * @class ImageLoader
 * @description A utility class for loading images with features like cancellation, placeholders, and logging.
 * Note: Image elements don't support native abort/cancellation, but this class tracks requests
 * to prevent stale image loads from updating the UI.
 */
export class ImageLoader {
	/**
	 * @private
	 * @property {CurrentImageRequest | null} currentRequest - Holds the current image loading request, or null if no request is active.
	 */
	private currentRequest: CurrentImageRequest | null = null;
	/**
	 * @private
	 * @property {string} defaultPlaceholder - The default placeholder image URL.
	 */
	private defaultPlaceholder: string;
	/**
	 * @private
	 * @property {boolean} enableLogging - Flag to enable or disable logging.
	 */
	private enableLogging: boolean;
	/**
	 * @private
	 * @property {Logger} logger - The logger instance for recording events.
	 */
	private logger: Logger;

	/**
	 * @constructor
	 * @param {ImageLoaderOptions} [options={}] - Options for configuring the ImageLoader.
	 */
	constructor(options: ImageLoaderOptions = {}) {
		this.defaultPlaceholder =
			options.placeholder ||
			'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNGY0ZjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU1ZTUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==';
		this.enableLogging = options.enableLogging ?? true;
		this.logger = createLogger('ImageLoader', {
			level: LogLevel.DEBUG,
		});
	}

	/**
	 * @method loadImage
	 * @description Initiates loading of an image and allows for callback functions.
	 * @param {string} url - The URL of the image to load.
	 * @param {LoadImageCallbacks & LoadImagePromiseOptions} [options={}] - Options including callbacks and target element.
	 * @returns {Promise<HTMLImageElement>} A promise that resolves with the HTMLImageElement on success.
	 */
	public loadImage(
		url: string,
		options: LoadImageCallbacks & LoadImagePromiseOptions = {},
	): Promise<HTMLImageElement> {
		const { onLoad, onError, onCancel, ...restOptions } = options;

		const promise = this.loadImagePromise(url, restOptions);

		// If callbacks provided, use them
		if (onLoad || onError || onCancel) {
			promise
				.then((img: HTMLImageElement) => onLoad?.(img))
				.catch((error: Error) => {
					if (error.message.includes('cancelled')) {
						onCancel?.();
					} else {
						onError?.(error);
					}
				});
		}

		return promise; // Also return promise for async/await usage
	}

	/**
	 * @method loadImagePromise
	 * @description Loads an image and returns a Promise, handling cancellation and placeholders.
	 * @private
	 * @param {string} url - The URL of the image to load.
	 * @param {LoadImagePromiseOptions} [options={}] - Options for the image loading, including target element and placeholder.
	 * @returns {Promise<HTMLImageElement>} A promise that resolves with the HTMLImageElement on success or rejects on error/cancel.
	 */
	private loadImagePromise(
		url: string,
		options: LoadImagePromiseOptions = {},
	): Promise<HTMLImageElement> {
		const { targetElement, placeholder = this.defaultPlaceholder } = options;

		// Validate targetElement if provided
		if (targetElement && !(targetElement instanceof HTMLImageElement)) {
			const errorMsg = 'targetElement must be an HTMLImageElement';
			if (this.enableLogging) {
				this.logger.warn(errorMsg);
			}
			return Promise.reject(new Error(errorMsg));
		}

		// Cancel any existing request
		this.cancel();

		const img = new Image();
		const request: CurrentImageRequest = {
			img,
			url,
			cancelled: false,
		};

		// If a targetElement is provided, set its src to the placeholder
		if (targetElement) {
			targetElement.src = placeholder;
			targetElement.classList.add('loading');
		}

		this.currentRequest = request;

		return new Promise<HTMLImageElement>((resolve, reject) => {
			const handleLoad = () => {
				// Only process if this request hasn't been cancelled
				if (!request.cancelled && this.currentRequest === request) {
					if (targetElement) {
						targetElement.src = url;
						targetElement.classList.remove('loading');
					}
					if (this.enableLogging) {
						this.logger.info(`✅ Loaded: ${url}`);
					}
					this.currentRequest = null;
					resolve(img);
				} else if (request.cancelled) {
					// Request was cancelled - don't update UI
					if (this.enableLogging) {
						this.logger.warn(
							`🚫 Load completed but request was cancelled: ${url}`,
						);
					}
				}
			};

			const handleError = () => {
				// Only process if this request hasn't been cancelled
				if (!request.cancelled && this.currentRequest === request) {
					if (targetElement) {
						targetElement.src = placeholder;
						targetElement.classList.remove('loading');
					}
					if (this.enableLogging) {
						this.logger.error(`❌ Error loading: ${url}`);
					}
					this.currentRequest = null;
					reject(new Error(`Failed to load image: ${url}`));
				} else if (request.cancelled) {
					// Request was cancelled - error doesn't matter
					if (this.enableLogging) {
						this.logger.warn(
							`🚫 Error occurred but request was already cancelled: ${url}`,
						);
					}
				}
			};

			// Add event listeners
			img.addEventListener('load', handleLoad, { once: true });
			img.addEventListener('error', handleError, { once: true });

			// Start loading
			img.src = url;
		});
	}

	/**
	 * @method loadImageSimple
	 * @description Loads an image without advanced features like cancellation or placeholders.
	 * @param {string} url - The URL of the image to load.
	 * @returns {Promise<HTMLImageElement>} A promise that resolves with the HTMLImageElement on success.
	 */
	public loadImageSimple(url: string): Promise<HTMLImageElement> {
		const img = new Image();

		return new Promise<HTMLImageElement>((resolve, reject) => {
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error(`Failed to load: ${url}`));
			img.src = url;
		});
	}

	/**
	 * @method cancel
	 * @description Cancels the currently active image loading request, if any.
	 * Note: This doesn't stop the browser from downloading the image, but prevents
	 * the cancelled request from updating the UI when it completes.
	 */
	public cancel(): void {
		if (this.currentRequest) {
			if (this.enableLogging) {
				this.logger.warn(`🚫 Cancelling request: ${this.currentRequest.url}`);
			}

			this.currentRequest.cancelled = true;

			// Clean up loading state if there's a target element
			// Note: We can't access the targetElement from here, but the next
			// load will handle cleanup when it sets the placeholder

			this.currentRequest = null;
		}
	}

	/**
	 * @method isLoading
	 * @description Checks if there is an image currently being loaded.
	 * @returns {boolean} True if an image is currently loading, false otherwise.
	 */
	public isLoading(): boolean {
		return this.currentRequest !== null && !this.currentRequest.cancelled;
	}
}
