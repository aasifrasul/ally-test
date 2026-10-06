import { useEffect, useRef, useState } from 'react';
import { ImageManager } from '../utils/ImageManager';

export interface UseImageOptions {
	placeholder?: string;
	/** Use fetch mode (retry + object-URL caching) instead of simple img.src loading. */
	useFetch?: boolean;
	onError?: (error: Error) => void;
	onLoad?: () => void;
}

export interface UseImageReturn {
	src: string;
	isLoading: boolean;
	error: Error | null;
	retry: () => void;
}

/**
 * React hook for loading a single image with placeholder, error state, and retry.
 *
 * @example
 * const { src, isLoading, error, retry } = useImage(imageUrl, {
 *   placeholder: '/placeholder.png',
 *   useFetch: true,
 * });
 */
export function useImage(
	url: string | undefined | null,
	options: UseImageOptions = {},
): UseImageReturn {
	const { placeholder, useFetch = false, onError, onLoad } = options;

	const manager = ImageManager.getInstance();
	const defaultPlaceholder = placeholder ?? manager['options'].placeholder;

	const [src, setSrc] = useState<string>(defaultPlaceholder);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	// Track the URL that was last kicked off so we can detect genuine changes.
	const loadedUrlRef = useRef<string | undefined | null>(null);
	// Track the object URL we need to revoke on cleanup (fetch mode only).
	const revokeUrlRef = useRef<string | null>(null);

	useEffect(() => {
		// Skip if nothing has changed and this isn't a manual retry.
		if (loadedUrlRef.current === url && retryCount === 0) return;
		loadedUrlRef.current = url;

		if (!url) {
			setSrc(defaultPlaceholder);
			setIsLoading(false);
			setError(null);
			return;
		}

		setSrc(defaultPlaceholder);
		setIsLoading(true);
		setError(null);

		let cancelled = false;

		(async () => {
			try {
				const loadedUrl = await manager.load(url, { useFetch });

				if (!cancelled) {
					setSrc(loadedUrl);
					setIsLoading(false);
					if (useFetch) revokeUrlRef.current = url;
					onLoad?.();
				}
			} catch (err) {
				if (!cancelled) {
					const e = err as Error;
					setError(e);
					setIsLoading(false);
					setSrc(defaultPlaceholder);
					onError?.(e);
				}
			}
		})();

		return () => {
			cancelled = true;
			if (useFetch && revokeUrlRef.current) {
				manager.revoke(revokeUrlRef.current);
				revokeUrlRef.current = null;
			}
		};
		// retryCount is intentionally included so manual retry re-runs the effect.
	}, [url, useFetch, retryCount]);

	return {
		src,
		isLoading,
		error,
		retry: () => setRetryCount((n) => n + 1),
	};
}
