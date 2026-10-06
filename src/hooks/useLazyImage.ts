import { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';
import { useImage } from './useImage';

/**
 * Shared options for lazy image hooks.
 */
export interface LazyImageOptions {
	placeholder?: string;
	rootMargin?: string;
	threshold?: number;
	onLoad?: () => void;
	onError?: (error: Error) => void;
}

/**
 * Lazy-loads an image once the host element enters the viewport.
 *
 * Combines intersection observation with `useImage` so callers get the same
 * `{ src, isLoading, error, retry }` state surface as `useImage` itself.
 *
 * @example
 * const { imgRef, src, isLoading } = useLazyImage(url, {
 *   placeholder: '/placeholder.png',
 *   rootMargin: '100px',
 * });
 *
 * return <img ref={imgRef} src={src} />;
 */
export const useLazyImage = (url: string, options: LazyImageOptions = {}) => {
	const { rootMargin = '50px', threshold = 0, onLoad, onError, placeholder } = options;

	const [shouldLoad, setShouldLoad] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	const observe = useIntersectionObserver({
		threshold,
		rootMargin,
		onIntersect: ([entry]) => {
			if (entry.isIntersecting) setShouldLoad(true);
		},
	});

	useEffect(() => {
		return observe(imgRef.current);
	}, [observe]);

	const imageState = useImage(shouldLoad ? url : null, { placeholder, onLoad, onError });

	return { imgRef, ...imageState };
};
