import { useEffect, useRef, useCallback } from 'react';

import { ImageLoader } from '../utils/ImageLoader';
import { useIntersectionObserver } from './useIntersectionObserver';

interface LazyImageOptions {
	src: string;
	placeholder?: string;
	rootMargin?: string;
	threshold?: number;
	onLoad?: () => void;
	onError?: (error: Error) => void;
}

const imageLoader = new ImageLoader();

export const useLazyImage = (options: LazyImageOptions) => {
	const imgRef = useRef<HTMLImageElement>(null);
	const loadedRef = useRef(false);
	const cleanupRef = useRef<(() => void) | undefined>(null);

	const loadImage = useCallback(async () => {
		if (!imgRef.current || loadedRef.current) return;

		const img = imgRef.current;
		loadedRef.current = true;

		try {
			await imageLoader.loadImageSimple(options.src);

			img.src = options.src;
			img.classList.remove('loading');
			options.onLoad?.();
		} catch (error) {
			console.error('Image loading failed:', error);
			options.onError?.(error as Error);
		}
	}, [options.src, options.onLoad, options.onError]);

	const handleIntersection: IntersectionObserverCallback = useCallback(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && !loadedRef.current) {
					loadImage();
					// Stop observing once we start loading
					if (cleanupRef.current) {
						cleanupRef.current();
						cleanupRef.current = null;
					}
				}
			});
		},
		[loadImage],
	);

	const observe = useIntersectionObserver({
		threshold: options.threshold || 0,
		rootMargin: options.rootMargin || '50px',
		onIntersect: handleIntersection,
	});

	const cleanup = () => {
		if (cleanupRef.current) {
			cleanupRef.current();
			cleanupRef.current = null;
		}
	};

	useEffect(() => {
		const img = imgRef.current;
		if (!img) return;

		// Set initial placeholder
		if (options.placeholder) {
			img.src = options.placeholder;
			img.classList.add('loading');
		}

		// Cleanup previous observation
		cleanup();

		// Start observing
		cleanupRef.current = observe(img);

		return () => {
			cleanup();
			loadedRef.current = false;
		};
	}, [observe, options.placeholder]);

	return imgRef;
};
