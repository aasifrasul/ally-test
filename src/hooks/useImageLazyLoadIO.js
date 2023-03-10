import React, { useCallback, useRef, useEffect } from 'react';

export const useImageLazyLoadIO = (imgSelector, items) => {
	const imageObserver = useCallback((node) => {
		const intObs = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.intersectionRatio > 0) {
					const currentImg = entry.target;
					const newImgSrc = currentImg.dataset.src;
					currentImg.removeAttribute('data-src');
					// only swap out the image source if the new url exists
					if (!newImgSrc) {
						console.error('Image source is invalid');
					} else {
						window.requestIdleCallback(
							() => {
								currentImg.src = newImgSrc;
							},
							{ timeout: 200 }
						);
					}
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
	}, [imageObserver, imageRef, imgSelector, items]);
};

export default useImageLazyLoadIO;
