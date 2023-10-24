import React, { useCallback, useRef, useEffect } from 'react';

export const useImageLazyLoadIO = (imgSelector, count) => {
	let ioObject, currentNode;

	const ioCallback = (entries) =>
		entries.forEach((entry) => {
			if (entry.intersectionRatio > 0) {
				const currentImg = entry.target;
				const ImageSrc = currentImg.dataset.src;
				currentImg.removeAttribute('data-src');
				// only swap out the image source if the new url exists

				ImageSrc &&
					requestIdleCallback(
						() => {
							currentImg.src = ImageSrc;
						},
						{
							timeout: 1000,
						},
					);

				ioObject?.unobserve(currentNode); // detach the observer when done
			}
		});

	const imageObserver = (node) => {
		currentNode = node;
		ioObject = new IntersectionObserver(ioCallback);
		ioObject.observe(node);
	};

	const memoizedImageObserver = useCallback(imageObserver, []);

	const imageRef = useRef(null);

	useEffect(() => {
		imageRef.current = document.querySelectorAll(imgSelector);
		imageRef?.current.forEach((img) => memoizedImageObserver(img));

		return () => (imageRef.current = null);
	}, [memoizedImageObserver, imageRef, count]);
};

export default useImageLazyLoadIO;
