import React, { useCallback, useEffect } from 'react';

interface ImageData {
	src: string;
}

export const useImageLazyLoadIO = (imgSelector: string, count: number): void => {
	let ioObject: IntersectionObserver | null = null;
	let currentNode: Element | null = null;

	const ioCallback = (entries: IntersectionObserverEntry[]) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const currentImg = entry.target as HTMLImageElement;
				const imageData: ImageData = {
					src: currentImg.dataset.src || '',
				};

				currentImg.removeAttribute('data-src');

				if (imageData.src) {
					requestIdleCallback(
						() => {
							currentImg.src = imageData.src;
						},
						{
							timeout: 1000,
						},
					);
				}

				ioObject?.unobserve(currentNode!);
			}
		});
	};

	const imageObserver = (node: Element) => {
		currentNode = node;
		ioObject = new IntersectionObserver(ioCallback);
		ioObject.observe(node);
	};

	const memoizedImageObserver = useCallback(imageObserver, []);

	useEffect(() => {
		const images = Array.from(document.querySelectorAll(imgSelector));
		images.forEach((img) => memoizedImageObserver(img));
	}, [memoizedImageObserver, imgSelector, count]);
};

export default useImageLazyLoadIO;
