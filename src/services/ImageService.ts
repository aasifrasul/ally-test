import { createLogger, LogLevel, Logger } from '../utils/Logger';

interface ImageLoadOptions {
	timeout?: number;
	maxRetries?: number;
	retryDelay?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 30000;

export class ImageService {
	private static instance: ImageService;
	private logger: Logger;
	private defaultOptions: ImageLoadOptions = {
		timeout: TIMEOUT,
		maxRetries: MAX_RETRIES,
		retryDelay: RETRY_DELAY,
	};

	private constructor() {
		this.logger = createLogger('ImageService', {
			level: LogLevel.DEBUG,
		});
	}

	public static getInstance(): ImageService {
		if (!ImageService.instance) {
			ImageService.instance = new ImageService();
		}
		return ImageService.instance;
	}

	private async loadWithRetry(url: string, options: ImageLoadOptions = {}): Promise<string> {
		const {
			timeout,
			maxRetries = MAX_RETRIES,
			retryDelay,
		} = { ...this.defaultOptions, ...options };
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeout);

				const response = await fetch(url, { signal: controller.signal });
				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const blob = await response.blob();

				// Validate that it's actually an image
				if (!blob.type.startsWith('image/')) {
					throw new Error('Response is not an image');
				}

				const objectUrl = URL.createObjectURL(blob);
				this.logger.debug('Successfully loaded image:', url);
				return objectUrl;
			} catch (error) {
				lastError = error as Error;
				if (attempt < maxRetries - 1) {
					this.logger.debug(
						`Retrying image load (${attempt + 1}/${maxRetries}):`,
						url,
					);
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
				}
			}
		}

		throw lastError || new Error(`Failed to load image: ${url}`);
	}

	async load(url: string, options?: ImageLoadOptions): Promise<string> {
		return this.loadWithRetry(url, options);
	}

	async loadMultiple(urls: string[], options?: ImageLoadOptions): Promise<string[]> {
		const promises = urls.map((url) =>
			this.loadWithRetry(url, options).catch((error) => {
				this.logger.error(`Failed to load image ${url}:`, error);
				return null;
			}),
		);

		const results = await Promise.all(promises);
		return results.filter((result): result is string => result !== null);
	}

	revokeObjectURL(url: string): void {
		try {
			URL.revokeObjectURL(url);
			this.logger.debug('Revoked object URL:', url);
		} catch (error) {
			this.logger.error('Failed to revoke object URL:', error);
		}
	}

	revokeMultipleObjectURLs(urls: string[]): void {
		urls.forEach((url) => this.revokeObjectURL(url));
	}
}
