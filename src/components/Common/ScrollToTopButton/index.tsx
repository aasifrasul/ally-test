import React, { useState, useCallback } from 'react';

import { useEventListener } from '../../../hooks/EventListeners/useEventListener';

import * as styles from './index.module.css';

const ScrollToTop: React.FC = () => {
	const [showTopBtn, setShowTopBtn] = useState<boolean>(false);

	const handleScroll = useCallback(() => {
		setShowTopBtn(window.scrollY > 500);
	}, []);

	useEventListener('scroll', handleScroll, window);

	const goToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	return (
		<div className={'top-to-btm'}>
			{showTopBtn && (
				<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
				</svg>
			)}
		</div>
	);
};

export default ScrollToTop;
