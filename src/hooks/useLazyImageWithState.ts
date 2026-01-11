import { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';
import { useImage } from './useImage';

interface LazyImageOptions {
	src: string;
	placeholder?: string;
	rootMargin?: string;
	threshold?: number;
	onLoad?: () => void;
	onError?: (error: Error) => void;
}

// For lazy loading WITH state control, combine them:
export const useLazyImageWithState = (url: string, options: LazyImageOptions) => {
	const [shouldLoad, setShouldLoad] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	const observe = useIntersectionObserver({
		threshold: options.threshold || 0,
		rootMargin: options.rootMargin || '50px',
		onIntersect: () => setShouldLoad(true),
	});

	useEffect(() => {
		if (imgRef.current) {
			return observe(imgRef.current);
		}
	}, [observe]);

	const imageState = useImage(shouldLoad ? url : null, options);

	return { imgRef, ...imageState };
};
