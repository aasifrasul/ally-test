import React, { useRef, useEffect } from 'react';
import { useEventListener } from '../../../hooks/EventListeners/useEventListener';

import './ScrollToTopButton.css';

const ScrollToTopButton: React.FC = () => {
	const didMount = useRef<boolean>(false);
	const scrollToTopBtn = useRef<HTMLButtonElement>(null);
	const rootElement = useRef<HTMLElement | null>(null);

	const handleScroll = (): void => {
		if (rootElement.current && scrollToTopBtn.current) {
			const scrollTotal =
				rootElement.current.scrollHeight - rootElement.current.clientHeight;
			if (rootElement.current.scrollTop / scrollTotal > 0.6) {
				scrollToTopBtn.current.classList.add('showBtn');
			} else {
				scrollToTopBtn.current.classList.remove('showBtn');
			}
		}
	};

	const scrollToTop = (): void => {
		rootElement.current?.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	useEventListener('click', scrollToTop, scrollToTopBtn.current);
	useEventListener('scroll', handleScroll, rootElement.current);

	useEffect(() => {
		if (!didMount.current) {
			didMount.current = true;
			rootElement.current = document.documentElement;
		}
	}, []);

	return (
		<footer>
			<button ref={scrollToTopBtn} className={'scrollToTopBtn'}>
				☝️
			</button>
		</footer>
	);
};

ScrollToTopButton.displayName = 'ScrollToTopButton';

export default ScrollToTopButton;
