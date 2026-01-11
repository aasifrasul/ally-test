import { useEffect, useRef, useCallback } from 'react';

import { ImageLoader } from '../utils/ImageLoader';
import { useIntersectionObserver } from './useIntersectionObserver';
import { useCallbackRef } from './useCallbackRef';

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

	// Store callbacks in refs to avoid recreating handleIntersection
	const onLoadRef = useCallbackRef(options?.onLoad);
	const onErrorRef = useCallbackRef(options?.onError);

	const loadImage = useCallback(async () => {
		if (!imgRef.current || loadedRef.current) return;

		const img = imgRef.current;
		loadedRef.current = true;

		try {
			await imageLoader.loadImageSimple(options.src);

			img.src = options.src;
			img.classList.remove('loading');
			onLoadRef.current?.();
		} catch (error) {
			console.error('Image loading failed:', error);
			onErrorRef.current?.(error as Error);
		}
	}, [options.src]); // Now only depends on src

	const cleanup = useCallback(() => {
		if (cleanupRef.current) {
			cleanupRef.current();
			cleanupRef.current = undefined;
		}
	}, []);

	const handleIntersection: IntersectionObserverCallback = useCallback(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && !loadedRef.current) {
					loadImage();
					cleanup();
				}
			});
		},
		[loadImage, cleanup], // Now stable dependencies
	);

	const observe = useIntersectionObserver({
		threshold: options.threshold || 0,
		rootMargin: options.rootMargin || '50px',
		onIntersect: handleIntersection,
	});

	useEffect(() => {
		const img = imgRef.current;
		if (!img) return;

		if (options.placeholder) {
			img.src = options.placeholder;
			img.classList.add('loading');
		}

		cleanupRef.current = observe(img);

		return () => {
			cleanup();
			loadedRef.current = false;
		};
	}, [options.placeholder, options.src, observe, cleanup]);

	return imgRef;
};
