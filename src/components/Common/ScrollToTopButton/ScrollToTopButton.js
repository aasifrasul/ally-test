import React from 'react';

import styles from './ScrollToTopButton.css';

const ScrollToTopButton = () => {
	const didMount = React.useRef(false);
	const scrollToTopBtn = React.useRef(false);
	const rootElement = React.useRef(false);

	const handleScroll = () => {
		// Do something on scroll
		const scrollTotal =
			rootElement.current.scrollHeight - rootElement.current.clientHeight;
		if (rootElement.current.scrollTop / scrollTotal > 0.6) {
			// Show button
			scrollToTopBtn.current.classList.add('showBtn');
		} else {
			// Hide button
			scrollToTopBtn.current.classList.remove('showBtn');
		}
	};

	const scrollToTop = () => {
		// Scroll to top logic
		rootElement.current.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	React.useEffect(() => {
		if (!didMount.current) {
			didMount.current = true;
			rootElement.current = document.documentElement;
			scrollToTopBtn.current.addEventListener('click', scrollToTop);
			rootElement.current.addEventListener('scroll', handleScroll);

			return () => {
				scrollToTopBtn.current.removeEventListener('click', scrollToTop);
				rootElement.current.removeEventListener('scroll', handleScroll);
			};
		}
	});

	return (
		<footer>
			{/* Scroll to top button */}
			<button ref={scrollToTopBtn} className={styles.scrollToTopBtn}>
				☝️
			</button>
		</footer>
	);
};

ScrollToTopButton.displayName = 'ScrollToTopButton';

export default ScrollToTopButton;
