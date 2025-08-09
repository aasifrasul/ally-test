import { useCallback, useEffect, useRef } from 'react';
import { useIntersectionObserver } from '../useIntersectionObserver';

interface UseImageLazyLoadProps {
	imgSelector: string;
	count: number;
	rootMargin?: string;
	loadTimeout?: number;
}

export const useImageLazyLoad = ({
	imgSelector,
	count,
	rootMargin = '50px',
	loadTimeout = 1000,
}: UseImageLazyLoadProps): void => {
	const loadedImages = useRef<Set<Element>>(new Set());

	const loadImage = useCallback(
		(img: HTMLImageElement) => {
			const dataSrc = img.getAttribute('data-src');

			if (!dataSrc || loadedImages.current.has(img)) {
				return;
			}

			loadedImages.current.add(img);
			img.loading = 'lazy';

			requestIdleCallback(
				() => {
					img.src = dataSrc;
					img.removeAttribute('data-src');
				},
				{ timeout: loadTimeout },
			);
		},
		[loadTimeout],
	);

	const handleIntersection: IntersectionObserverCallback = useCallback(
		(entries, observer) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const img = entry.target as HTMLImageElement;
					loadImage(img);
				}
			});
		},
		[loadImage],
	);

	const observe = useIntersectionObserver({
		threshold: 0,
		rootMargin,
		onIntersect: handleIntersection,
	});

	useEffect(() => {
		loadedImages.current.clear();
		const images = Array.from(document.querySelectorAll(imgSelector));

		images.forEach((img) => {
			if (!loadedImages.current.has(img)) {
				observe(img);
			}
		});

		return () => {
			images.forEach((img) => {
				const cleanup = observe(img);
				cleanup?.();
			});
		};
	}, [imgSelector, count, observe]);
};
