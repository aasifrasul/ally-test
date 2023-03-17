import React, { useCallback, useRef, useEffect } from 'react';

export const useImageLazyLoadIO = (imgSelector, count) => {
	const imageObserver = useCallback((node) => {
		const intObs = new IntersectionObserver((entries) => {
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
							{ timeout: 1000 }
						);

					intObs.unobserve(node); // detach the observer when done
				}
			});
		});
		intObs.observe(node);
	}, []);

	const imageRef = useRef(null);

	useEffect(() => {
		imageRef.current = document.querySelectorAll(imgSelector);
		imageRef?.current.forEach((img) => imageObserver(img));

		return () => {
			imageRef.current = null;
		};
	}, [imageObserver, imageRef, count]);
};

export default useImageLazyLoadIO;
