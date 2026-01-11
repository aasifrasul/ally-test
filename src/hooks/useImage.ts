import { useEffect, useRef, useState } from 'react';
import { ImageManager } from '../utils/ImageManager';

/**
 * @interface UseImageOptions
 * @description Options for the useImage hook.
 */
export interface UseImageOptions {
	/**
	 * @property {string} [placeholder] - Placeholder image URL.
	 */
	placeholder?: string;
	/**
	 * @property {boolean} [useFetch] - Use fetch mode with retry/caching.
	 */
	useFetch?: boolean;
	/**
	 * @property {((error: Error) => void)} [onError] - Error callback.
	 */
	onError?: (error: Error) => void;
	/**
	 * @property {(() => void)} [onLoad] - Success callback.
	 */
	onLoad?: () => void;
}

/**
 * @interface UseImageReturn
 * @description Return value from useImage hook.
 */
export interface UseImageReturn {
	/**
	 * @property {string} src - The current image src (placeholder, actual, or error fallback).
	 */
	src: string;
	/**
	 * @property {boolean} isLoading - Whether the image is currently loading.
	 */
	isLoading: boolean;
	/**
	 * @property {Error | null} error - Error if load failed, null otherwise.
	 */
	error: Error | null;
	/**
	 * @property {() => void} retry - Function to retry loading the image.
	 */
	retry: () => void;
}

/**
 * @hook useImage
 * @description React hook for loading images with automatic cleanup.
 * @param {string | undefined | null} url - The image URL to load.
 * @param {UseImageOptions} [options] - Loading options.
 * @returns {UseImageReturn} Image loading state and controls.
 *
 * @example
 * const { src, isLoading, error, retry } = useImage(imageUrl, {
 *   placeholder: '/placeholder.png',
 *   useFetch: true,
 *   onError: (err) => console.error(err)
 * });
 */
export function useImage(
	url: string | undefined | null,
	options: UseImageOptions = {},
): UseImageReturn {
	const { placeholder, useFetch = false, onError, onLoad } = options;
	const manager = ImageManager.getInstance({ useFetch });
	const defaultPlaceholder = placeholder || manager['options'].placeholder;

	const [src, setSrc] = useState<string>(defaultPlaceholder);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	const currentUrlRef = useRef<string | undefined | null>(url);
	const revokeUrlRef = useRef<string | null>(null);

	useEffect(() => {
		// If URL hasn't changed and we're not retrying, skip
		if (currentUrlRef.current === url && retryCount === 0) {
			return;
		}

		currentUrlRef.current = url;

		// If no URL, show placeholder
		if (!url) {
			setSrc(defaultPlaceholder);
			setIsLoading(false);
			setError(null);
			return;
		}

		// Start loading
		setIsLoading(true);
		setError(null);
		setSrc(defaultPlaceholder);

		let cancelled = false;

		const loadImage = async () => {
			try {
				const loadedUrl = await manager.load(url, { useFetch });

				if (!cancelled) {
					setSrc(loadedUrl);
					setIsLoading(false);

					// Track object URL for cleanup if using fetch
					if (useFetch) {
						revokeUrlRef.current = url;
					}

					onLoad?.();
				}
			} catch (err) {
				if (!cancelled) {
					const error = err as Error;
					setError(error);
					setIsLoading(false);
					setSrc(defaultPlaceholder);
					onError?.(error);
				}
			}
		};

		loadImage();

		// Cleanup function
		return () => {
			cancelled = true;

			// Revoke object URL if we were using fetch mode
			if (useFetch && revokeUrlRef.current) {
				manager.revoke(revokeUrlRef.current);
				revokeUrlRef.current = null;
			}
		};
	}, [url, useFetch, retryCount]);

	const retry = () => {
		setRetryCount((prev) => prev + 1);
	};

	return { src, isLoading, error, retry };
}
